# Порядок сборки (один раз)

## Сервер
```bash
dotnet new web -n CarsApi            # затем замените .cs файлы файлами из CarsApi/
cd CarsApi
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package FluentValidation.DependencyInjectionExtensions
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.AspNetCore.OpenApi
dotnet add package Scalar.AspNetCore
dotnet add package BCrypt.Net-Next
dotnet tool install --global dotnet-ef
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "любая-длинная-строка-минимум-32-символа!!"

dotnet ef migrations add InitialCreate         # миграция 1
# раскомментируйте HasIndex в AppDb.cs
dotnet ef migrations add UniqueUsername        # миграция 2
dotnet run --urls http://localhost:5000
```

## Клиент
```bash
ng new cars-web --style=css --routing --skip-git
cd cars-web
# скопируйте src/app/*.ts, src/styles.css, proxy.conf.json поверх созданных
# в package.json: "start": "ng serve --proxy-config proxy.conf.json"
npm start
```
Если после `ng new` корневой класс называется иначе (не `App`), поправьте импорт в `src/main.ts`.
