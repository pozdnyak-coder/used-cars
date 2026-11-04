import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CarsService } from './cars.service';
import { AuthService } from './auth.service';
import { CarRequest } from './models';

const currentYear = new Date().getFullYear();

// ОСОБОЕ ПРАВИЛО (то же, что на сервере): машина текущего года — пробег ≤ 50 000
function newCarMileage(group: AbstractControl): ValidationErrors | null {
  const year = group.get('year')?.value;
  const mileage = group.get('mileage')?.value;
  return year === currentYear && mileage > 50000 ? { newCarMileage: true } : null;
}

@Component({
  selector: 'app-car-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <a routerLink="/">← К списку</a>
    <h1>{{ isEdit() ? 'Редактирование' : 'Новое объявление' }}</h1>

    @if (isEdit() && existing.isLoading()) {
      <p class="state">Загрузка…</p>
    } @else if (isEdit() && existing.error()) {
      <p class="state error">Не удалось загрузить объявление.</p>
    } @else if (isEdit() && !allowed()) {
      <p class="state error">Редактировать может только автор.</p>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label>Марка
          <select formControlName="brandId">
            <option [ngValue]="null">— выберите —</option>
            @for (b of cars.brands.value() ?? []; track b.id) { <option [ngValue]="b.id">{{ b.name }}</option> }
          </select>
          <small class="error">{{ msg('brandId') }}</small>
        </label>
        <label>Модель
          <input formControlName="model" />
          <small class="error">{{ msg('model') }}</small>
        </label>
        <label>Год
          <input type="number" formControlName="year" />
          <small class="error">{{ msg('year') }}</small>
        </label>
        <label>Пробег, км
          <input type="number" formControlName="mileage" />
          <small class="error">{{ msg('mileage') }}</small>
        </label>
        <label>Цена, $
          <input type="number" formControlName="price" />
          <small class="error">{{ msg('price') }}</small>
        </label>
        <label>Цвет
          <input formControlName="color" />
          <small class="error">{{ msg('color') }}</small>
        </label>

        @if (formError()) { <p class="error">{{ formError() }}</p> }
        <button type="submit" [disabled]="saving()">{{ saving() ? 'Сохранение…' : 'Сохранить' }}</button>
      </form>
    }
  `,
})
export class CarFormComponent {
  cars = inject(CarsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  id = input<string>();                          // есть — редактирование, нет — создание
  isEdit = computed(() => !!this.id());
  existing = this.cars.one(() => (this.id() ? Number(this.id()) : undefined));
  allowed = computed(() => !this.existing.hasValue() || this.existing.value().ownerId === this.auth.userId());

  saving = signal(false);
  formError = signal('');

  form = this.fb.group({
    brandId: this.fb.control<number | null>(null, Validators.required),
    model: ['', [Validators.required, Validators.maxLength(100)]],
    year: [currentYear, [Validators.required, Validators.min(1950), Validators.max(currentYear)]],
    mileage: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(1), Validators.max(100000000)]],
    color: ['', [Validators.required, Validators.maxLength(30)]],
  }, { validators: newCarMileage });

  constructor() {
    effect(() => {
      const c = this.existing.value();
      if (c) this.form.patchValue({ brandId: c.brandId, model: c.model, year: c.year, mileage: c.mileage, price: c.price, color: c.color });
    });
  }

  msg(name: string): string {
    const c = this.form.get(name);
    if (!c || !(c.touched || c.dirty)) return '';
    const e = c.errors ?? {};
    if (e['server']) return e['server'];
    if (e['required']) return 'Обязательное поле';
    if (e['maxlength']) return `Не длиннее ${e['maxlength'].requiredLength} символов`;
    if (e['min']) return `Не меньше ${e['min'].min}`;
    if (e['max']) return `Не больше ${e['max'].max}`;
    if (name === 'mileage' && this.form.errors?.['newCarMileage'])
      return 'У машины текущего года пробег не может быть больше 50 000 км';
    return '';
  }

  submit() {
    this.formError.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const dto = this.form.getRawValue() as CarRequest;
    const call = this.id() ? this.cars.update(Number(this.id()), dto) : this.cars.create(dto);
    this.saving.set(true);
    call.subscribe({
      next: car => this.router.navigate(['/cars', car.id]),
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        if (err.status === 400 && err.error?.errors) {
          // ошибки сервера — под нужным полем
          for (const [field, messages] of Object.entries<string[]>(err.error.errors)) {
            this.form.get(field)?.setErrors({ server: messages[0] });
            this.form.get(field)?.markAsTouched();
          }
        } else if (err.status === 401) {
          this.router.navigateByUrl('/login');
        } else if (err.status === 403) {
          this.formError.set('Нет прав: менять запись может только автор');
        } else {
          this.formError.set('Ошибка сервера, попробуйте позже');
        }
      },
    });
  }
}
