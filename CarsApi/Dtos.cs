using System.Linq.Expressions;

namespace CarsApi;

public record CarRequest(string Model, int Year, int Mileage, int Price, string Color, int BrandId);

public record CarDto(int Id, string Model, int Year, int Mileage, int Price, string Color,
                     int BrandId, string BrandName, int OwnerId, string? ImageUrl);

public record BrandDto(int Id, string Name);

public record PagedResult<T>(List<T> Items, int Page, int PageSize, int Total);

public record RegisterRequest(string Username, string Password);
public record LoginRequest(string Username, string Password);
public record AuthResponse(string Token, int UserId, string Username);

public static class CarMap
{
    // Сущность базы наружу не отдаём — только DTO
    public static readonly Expression<Func<Car, CarDto>> ToDto = c => new CarDto(
        c.Id, c.Model, c.Year, c.Mileage, c.Price, c.Color,
        c.BrandId, c.Brand!.Name, c.OwnerId,
        c.ImageFileName == null ? null : "/uploads/" + c.ImageFileName);
}
