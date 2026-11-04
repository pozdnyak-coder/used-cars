import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Brand, CarFilter } from './models';

@Component({
  selector: 'app-car-filter',
  imports: [FormsModule],
  template: `
    <form class="filter" (submit)="apply(); $event.preventDefault()">
      <label>Марка
        <select name="brand" [(ngModel)]="brandId">
          <option [ngValue]="null">Все</option>
          @for (b of brands(); track b.id) { <option [ngValue]="b.id">{{ b.name }}</option> }
        </select>
      </label>
      <label>Цена до
        <input type="number" name="maxPrice" min="0" [(ngModel)]="maxPrice" />
      </label>
      <label>Год от
        <input type="number" name="yearFrom" min="1950" [(ngModel)]="yearFrom" />
      </label>
      <label>Сортировка
        <select name="sort" [(ngModel)]="sort">
          <option value="new:desc">Новые</option>
          <option value="price:asc">Цена ↑</option>
          <option value="price:desc">Цена ↓</option>
          <option value="mileage:asc">Пробег ↑</option>
          <option value="mileage:desc">Пробег ↓</option>
        </select>
      </label>
      <button type="submit">Применить</button>
      <button type="button" (click)="reset()">Сбросить</button>
    </form>
  `,
})
export class CarFilterComponent {
  brands = input.required<Brand[]>();
  changed = output<CarFilter>();

  brandId = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  yearFrom = signal<number | null>(null);
  sort = signal('new:desc');

  apply() {
    const [sort, dir] = this.sort().split(':');
    this.changed.emit({
      brandId: this.brandId(), maxPrice: this.maxPrice() || null,
      yearFrom: this.yearFrom() || null, sort, dir,
    });
  }

  reset() {
    this.brandId.set(null); this.maxPrice.set(null); this.yearFrom.set(null); this.sort.set('new:desc');
    this.apply();
  }
}
