using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CarsApi;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDb>(o => o.UseSqlite("Data Source=cars.db"));
builder.Services.AddValidatorsFromAssemblyContaining<CarRequestValidator>();
builder.Services.AddOpenApi();
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod()));

// Ключ подписи — ТОЛЬКО из user-secrets: dotnet user-secrets set "Jwt:Key" "..."
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Не задан Jwt:Key. Выполните: dotnet user-secrets set \"Jwt:Key\" \"<строка от 32 символов>\"");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = signingKey
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// Папка для загруженных файлов
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);

// Миграции + тестовый пользователь (Id = 1 — автор seed-записей)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDb>();
    db.Database.Migrate();
    if (!db.Users.Any())
    {
        db.Users.Add(new User { Id = 1, Username = "test", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!") });
        db.SaveChanges();
    }
}

app.UseCors();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});
app.UseAuthentication();
app.UseAuthorization();

app.MapOpenApi();
app.MapScalarApiReference();   // Scalar: /scalar

// ---------- helpers ----------
static int UserId(ClaimsPrincipal u) => int.Parse(u.FindFirstValue(ClaimTypes.NameIdentifier)!);

static Dictionary<string, string[]> Errors(FluentValidation.Results.ValidationResult r) =>
    r.Errors.GroupBy(e => char.ToLowerInvariant(e.PropertyName[0]) + e.PropertyName[1..])
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).Distinct().ToArray());

IResult Single(string field, string message) =>
    Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });

string MakeToken(User u)
{
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, u.Id.ToString()),
        new Claim(ClaimTypes.Name, u.Username)
    };
    var jwt = new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.AddHours(8),
        signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256));
    return new JwtSecurityTokenHandler().WriteToken(jwt);
}

// ---------- AUTH ----------
var auth = app.MapGroup("/api/auth").WithTags("Auth");

auth.MapPost("/register", async (RegisterRequest req, IValidator<RegisterRequest> v, AppDb db) =>
{
    var vr = await v.ValidateAsync(req);
    if (!vr.IsValid) return Results.ValidationProblem(Errors(vr));
    if (await db.Users.AnyAsync(u => u.Username == req.Username))
        return Single("username", "Такой логин уже занят");

    var user = new User { Username = req.Username, PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password) };
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Ok(new AuthResponse(MakeToken(user), user.Id, user.Username));
});

auth.MapPost("/login", async (LoginRequest req, AppDb db) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == req.Username);
    if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        return Results.Problem("Неверный логин или пароль", statusCode: 401);
    return Results.Ok(new AuthResponse(MakeToken(user), user.Id, user.Username));
});

// ---------- BRANDS (справочник) ----------
app.MapGet("/api/brands", async (AppDb db) =>
    await db.Brands.OrderBy(b => b.Name).Select(b => new BrandDto(b.Id, b.Name)).ToListAsync())
   .WithTags("Brands");

// ---------- CARS ----------
var cars = app.MapGroup("/api/cars").WithTags("Cars");

// GET список: страницы + фильтры (марка, цена до, год от) + сортировка (цена, пробег)
cars.MapGet("/", async (AppDb db, int page = 1, int pageSize = 6, int? brandId = null,
                        int? maxPrice = null, int? yearFrom = null, string? sort = null, string? dir = null) =>
{
    page = Math.Max(page, 1);
    pageSize = Math.Clamp(pageSize, 1, 50);

    var q = db.Cars.AsQueryable();
    if (brandId is not null) q = q.Where(c => c.BrandId == brandId);
    if (maxPrice is not null) q = q.Where(c => c.Price <= maxPrice);
    if (yearFrom is not null) q = q.Where(c => c.Year >= yearFrom);

    var total = await q.CountAsync();

    IQueryable<Car> ordered = (sort, dir) switch
    {
        ("price", "desc") => q.OrderByDescending(c => c.Price),
        ("price", _) => q.OrderBy(c => c.Price),
        ("mileage", "desc") => q.OrderByDescending(c => c.Mileage),
        ("mileage", _) => q.OrderBy(c => c.Mileage),
        _ => q.OrderByDescending(c => c.Id)
    };

    var items = await ordered.Skip((page - 1) * pageSize).Take(pageSize)
        .Select(CarMap.ToDto).ToListAsync();
    return Results.Ok(new PagedResult<CarDto>(items, page, pageSize, total));
});

cars.MapGet("/{id:int}", async (int id, AppDb db) =>
{
    var dto = await db.Cars.Where(c => c.Id == id).Select(CarMap.ToDto).FirstOrDefaultAsync();
    return dto is null ? Results.NotFound() : Results.Ok(dto);
});

// POST — только вошедший (иначе 401)
cars.MapPost("/", async (CarRequest req, IValidator<CarRequest> v, AppDb db, ClaimsPrincipal user) =>
{
    var vr = await v.ValidateAsync(req);
    if (!vr.IsValid) return Results.ValidationProblem(Errors(vr));
    if (!await db.Brands.AnyAsync(b => b.Id == req.BrandId))
        return Single("brandId", "Марка не найдена");

    var car = new Car
    {
        Model = req.Model.Trim(), Year = req.Year, Mileage = req.Mileage, Price = req.Price,
        Color = req.Color.Trim(), BrandId = req.BrandId, OwnerId = UserId(user)
    };
    db.Cars.Add(car);
    await db.SaveChangesAsync();
    var dto = await db.Cars.Where(c => c.Id == car.Id).Select(CarMap.ToDto).FirstAsync();
    return Results.Created($"/api/cars/{car.Id}", dto);
}).RequireAuthorization();

// PUT — только автор (иначе 403)
cars.MapPut("/{id:int}", async (int id, CarRequest req, IValidator<CarRequest> v, AppDb db, ClaimsPrincipal user) =>
{
    var car = await db.Cars.FindAsync(id);
    if (car is null) return Results.NotFound();
    if (car.OwnerId != UserId(user)) return Results.Problem("Менять запись может только автор", statusCode: 403);

    var vr = await v.ValidateAsync(req);
    if (!vr.IsValid) return Results.ValidationProblem(Errors(vr));
    if (!await db.Brands.AnyAsync(b => b.Id == req.BrandId))
        return Single("brandId", "Марка не найдена");

    car.Model = req.Model.Trim(); car.Year = req.Year; car.Mileage = req.Mileage;
    car.Price = req.Price; car.Color = req.Color.Trim(); car.BrandId = req.BrandId;
    await db.SaveChangesAsync();
    var dto = await db.Cars.Where(c => c.Id == id).Select(CarMap.ToDto).FirstAsync();
    return Results.Ok(dto);
}).RequireAuthorization();

// DELETE — только автор (иначе 403)
cars.MapDelete("/{id:int}", async (int id, AppDb db, ClaimsPrincipal user) =>
{
    var car = await db.Cars.FindAsync(id);
    if (car is null) return Results.NotFound();
    if (car.OwnerId != UserId(user)) return Results.Problem("Удалять запись может только автор", statusCode: 403);

    if (car.ImageFileName is not null)
    {
        var old = Path.Combine(uploadsPath, car.ImageFileName);
        if (File.Exists(old)) File.Delete(old);
    }
    db.Cars.Remove(car);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// Загрузка файла — только автор; до 5 МБ; jpg/png/webp; имя на сервере — Guid
cars.MapPost("/{id:int}/image", async (int id, IFormFile file, AppDb db, ClaimsPrincipal user) =>
{
    var car = await db.Cars.FindAsync(id);
    if (car is null) return Results.NotFound();
    if (car.OwnerId != UserId(user)) return Results.Problem("Загружать файл может только автор", statusCode: 403);

    if (file.Length == 0) return Single("file", "Файл пустой");
    if (file.Length > 5 * 1024 * 1024) return Single("file", "Файл больше 5 МБ");

    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
    string[] allowedExt = [".jpg", ".jpeg", ".png", ".webp"];
    string[] allowedMime = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedExt.Contains(ext) || !allowedMime.Contains(file.ContentType))
        return Single("file", "Разрешены только jpg, png, webp");

    var newName = Guid.NewGuid() + ext;
    await using (var fs = File.Create(Path.Combine(uploadsPath, newName)))
        await file.CopyToAsync(fs);

    if (car.ImageFileName is not null)
    {
        var old = Path.Combine(uploadsPath, car.ImageFileName);
        if (File.Exists(old)) File.Delete(old);
    }
    car.ImageFileName = newName;
    await db.SaveChangesAsync();
    var dto = await db.Cars.Where(c => c.Id == id).Select(CarMap.ToDto).FirstAsync();
    return Results.Ok(dto);
}).RequireAuthorization().DisableAntiforgery();

app.Run();
