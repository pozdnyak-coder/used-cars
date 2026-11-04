using FluentValidation;

namespace CarsApi;

public class CarRequestValidator : AbstractValidator<CarRequest>
{
    public CarRequestValidator()
    {
        var currentYear = DateTime.UtcNow.Year;

        RuleFor(x => x.Model).NotEmpty().WithMessage("Укажите модель")
            .MaximumLength(100).WithMessage("Не длиннее 100 символов");
        RuleFor(x => x.Year).InclusiveBetween(1950, currentYear)
            .WithMessage($"Год от 1950 до {currentYear}");
        RuleFor(x => x.Mileage).GreaterThanOrEqualTo(0).WithMessage("Пробег не может быть отрицательным");
        RuleFor(x => x.Price).InclusiveBetween(1, 100_000_000).WithMessage("Цена от 1 до 100 000 000");
        RuleFor(x => x.Color).NotEmpty().WithMessage("Укажите цвет")
            .MaximumLength(30).WithMessage("Не длиннее 30 символов");
        RuleFor(x => x.BrandId).GreaterThan(0).WithMessage("Выберите марку");

        // ОСОБОЕ ПРАВИЛО: у машины текущего года пробег не больше 50 000 км
        RuleFor(x => x.Mileage)
            .Must((x, mileage) => x.Year != currentYear || mileage <= 50_000)
            .WithMessage("У машины текущего года пробег не может быть больше 50 000 км");
    }
}

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Username).NotEmpty().WithMessage("Укажите логин")
            .Length(3, 30).WithMessage("Логин от 3 до 30 символов");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Укажите пароль")
            .MinimumLength(6).WithMessage("Пароль не короче 6 символов");
    }
}
