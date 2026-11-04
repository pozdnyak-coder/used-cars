import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Car } from './models';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-car-card',
  imports: [RouterLink, DecimalPipe],
  template: `
    <article class="card">
      @if (car().imageUrl) {
        <img [src]="car().imageUrl" [alt]="car().model" />
      } @else {
        <div class="no-photo">Нет фото</div>
      }
      <h3>{{ car().brandName }} {{ car().model }}</h3>
      <p>{{ car().year }} г. · {{ car().mileage | number }} км · {{ car().color }}</p>
      <p class="price">{{ car().price | number }} $</p>
      <div class="row">
        <a [routerLink]="['/cars', car().id]">Открыть</a>
        @if (isOwner()) {
          <a [routerLink]="['/cars', car().id, 'edit']">Редактировать</a>
          <button type="button" class="danger" (click)="deleted.emit(car().id)">Удалить</button>
        }
      </div>
    </article>
  `,
})
export class CarCardComponent {
  private auth = inject(AuthService);
  car = input.required<Car>();
  deleted = output<number>();
  isOwner = computed(() => this.auth.userId() === this.car().ownerId);
}
