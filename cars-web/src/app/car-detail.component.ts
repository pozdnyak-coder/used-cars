import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { CarsService } from './cars.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-car-detail',
  imports: [RouterLink, DecimalPipe],
  template: `
    <a routerLink="/">← К списку</a>
    @if (res.isLoading()) {
      <p class="state">Загрузка…</p>
    } @else if (res.error()) {
      <p class="state error">Объявление не найдено или ошибка загрузки.</p>
    } @else if (res.value(); as car) {
      <article class="detail">
        @if (car.imageUrl) { <img [src]="car.imageUrl" [alt]="car.model" /> }
        @else { <div class="no-photo">Нет фото</div> }
        <h1>{{ car.brandName }} {{ car.model }}</h1>
        <ul>
          <li>Год: {{ car.year }}</li>
          <li>Пробег: {{ car.mileage | number }} км</li>
          <li>Цвет: {{ car.color }}</li>
          <li class="price">Цена: {{ car.price | number }} $</li>
        </ul>

        @if (isOwner()) {
          <div class="row">
            <a [routerLink]="['/cars', car.id, 'edit']">Редактировать</a>
            <button class="danger" (click)="remove()">Удалить</button>
            <label class="upload">Загрузить файл
              <input type="file" accept=".jpg,.jpeg,.png,.webp" (change)="onFile($event)" hidden />
            </label>
          </div>
          @if (uploadError()) { <p class="error">{{ uploadError() }}</p> }
        }
      </article>
    }
  `,
})
export class CarDetailComponent {
  private cars = inject(CarsService);
  private auth = inject(AuthService);
  private router = inject(Router);

  id = input.required<string>();
  res = this.cars.one(() => Number(this.id()));
  isOwner = computed(() => this.res.hasValue() && this.auth.userId() === this.res.value().ownerId);
  uploadError = signal('');

  remove() {
    if (!confirm('Удалить объявление?')) return;
    this.cars.remove(Number(this.id())).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => this.uploadError.set('Не удалось удалить'),
    });
  }

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploadError.set('');
    // те же правила, что и на сервере
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { this.uploadError.set('Разрешены только jpg, png, webp'); return; }
    if (file.size > 5 * 1024 * 1024) { this.uploadError.set('Файл больше 5 МБ'); return; }

    this.cars.upload(Number(this.id()), file).subscribe({
      next: () => this.res.reload(),
      error: e => this.uploadError.set(e.error?.errors?.file?.[0] ?? e.error?.title ?? 'Ошибка загрузки'),
    });
  }
}
