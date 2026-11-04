# Вариант №5 — Подержанные автомобили

Студент: <Поздняков М>
Стек: ASP.NET Core Web API (.NET 10, Minimal API) + EF Core + SQLite + Angular.

## Запуск сервера
```bash
cd CarsApi
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "любая-длинная-строка-минимум-32-символа!!"
dotnet run --urls http://localhost:5000
```
Документация API (Scalar): http://localhost:5000/scalar
База `cars.db` создаётся автоматически (миграции применяются при старте).

## Запуск клиента
```bash
cd cars-web
npm install
npm start          # ng serve --proxy-config proxy.conf.json
```
Открыть http://localhost:4200

## Тестовый пользователь
Логин: `test`  Пароль: `Test123!`

## Особое правило
У машины текущего года пробег не больше 50 000 км (проверяется на сервере FluentValidation и в форме на клиенте).

## Запросы
Файл `requests.http` — все endpoint'ы, включая вход и загрузку файла.

## Скриншоты
1. Список — `docs/1-list.png`
2. Страница записи — `docs/2-detail.png`
3. Форма с ошибками — `docs/3-form-errors.png`
4. Загруженное фото — `docs/4-photo.png`
