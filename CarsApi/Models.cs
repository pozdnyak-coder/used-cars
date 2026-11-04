namespace CarsApi;

// Справочник (марка) — сторона "один"
public class Brand
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<Car> Cars { get; set; } = [];
}

// Главная сущность — сторона "многие"
public class Car
{
    public int Id { get; set; }
    public string Model { get; set; } = "";
    public int Year { get; set; }
    public int Mileage { get; set; }      // км
    public int Price { get; set; }        // целое число (SQLite не умеет ORDER BY по decimal)
    public string Color { get; set; } = "";
    public int BrandId { get; set; }
    public Brand? Brand { get; set; }
    public int OwnerId { get; set; }      // автор записи
    public string? ImageFileName { get; set; }
}

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
}
