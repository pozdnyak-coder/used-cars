using Microsoft.EntityFrameworkCore;

namespace CarsApi;

public class AppDb(DbContextOptions<AppDb> options) : DbContext(options)
{
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Car> Cars => Set<Car>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Brand>()
            .HasMany(b => b.Cars).WithOne(c => c.Brand)
            .HasForeignKey(c => c.BrandId)
            .OnDelete(DeleteBehavior.Restrict);

        // Начальные данные: справочник + 5 записей
        mb.Entity<Brand>().HasData(
            new Brand { Id = 1, Name = "Toyota" },
            new Brand { Id = 2, Name = "BMW" },
            new Brand { Id = 3, Name = "Chevrolet" },
            new Brand { Id = 4, Name = "Kia" },
            new Brand { Id = 5, Name = "Mercedes-Benz" });

        // OwnerId = 1 — тестовый пользователь, создаётся при старте (см. Program.cs)
        mb.Entity<Car>().HasData(
            new Car { Id = 1, Model = "Camry", Year = 2019, Mileage = 68000, Price = 18500, Color = "Белый", BrandId = 1, OwnerId = 1 },
            new Car { Id = 2, Model = "X5", Year = 2017, Mileage = 112000, Price = 29900, Color = "Чёрный", BrandId = 2, OwnerId = 1 },
            new Car { Id = 3, Model = "Cobalt", Year = 2021, Mileage = 24000, Price = 9800, Color = "Серый", BrandId = 3, OwnerId = 1 },
            new Car { Id = 4, Model = "Sportage", Year = 2020, Mileage = 45000, Price = 21500, Color = "Красный", BrandId = 4, OwnerId = 1 },
            new Car { Id = 5, Model = "E-Class", Year = 2016, Mileage = 138000, Price = 24000, Color = "Синий", BrandId = 5, OwnerId = 1 });

        // >>> МИГРАЦИЯ №2: раскомментируйте строку ниже и выполните
        // dotnet ef migrations add UniqueUsername
        mb.Entity<User>().HasIndex(u => u.Username).IsUnique();
    }
}
