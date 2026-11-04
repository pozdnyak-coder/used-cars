import { Component, computed, inject, signal } from '@angular/core';
import { CarsService } from './cars.service';
import { CarCardComponent } from './car-card.component';
import { CarFilterComponent } from './car-filter.component';
import { CarFilter } from './models';

@Component({
  selector: 'app-car-list',
  imports: [CarCardComponent, CarFilterComponent],
  template: `
    <h1>Подержанные автомобили</h1>
    <app-car-filter [brands]="cars.brands.value() ?? []" (changed)="onFilter($event)" />

    @if (res.isLoading()) {
      <p class="state">Загрузка…</p>
    } @else if (res.error()) {
      <p class="state error">Не удалось загрузить список. <button (click)="res.reload()">Повторить</button></p>
    } @else if (res.value(); as data) {
      @if (data.items.length === 0) {
        <p class="state">Ничего не найдено. Измените фильтр.</p>
      } @else {
        <div class="grid">
          @for (c of data.items; track c.id) {
            <app-car-card [car]="c" (deleted)="onDelete($event)" />
          }
        </div>
        <div class="pager">
          <button [disabled]="page() <= 1" (click)="page.set(page() - 1)">← Назад</button>
          <span>Страница {{ page() }} из {{ totalPages() }} (всего: {{ data.total }})</span>
          <button [disabled]="page() >= totalPages()" (click)="page.set(page() + 1)">Вперёд →</button>
        </div>
      }
    }
  `,
})
export class CarListComponent {
  cars = inject(CarsService);

  page = signal(1);
  private pageSize = 6;
  filter = signal<CarFilter>({ brandId: null, maxPrice: null, yearFrom: null, sort: 'new', dir: 'desc' });

  res = this.cars.list(() => ({ ...this.filter(), page: this.page(), pageSize: this.pageSize }));
  totalPages = computed(() => Math.max(1, Math.ceil((this.res.value()?.total ?? 0) / this.pageSize)));

  onFilter(f: CarFilter) { this.filter.set(f); this.page.set(1); }

  onDelete(id: number) {
    if (!confirm('Удалить объявление?')) return;
    this.cars.remove(id).subscribe({
      next: () => { if (this.page() > 1 && this.res.value()?.items.length === 1) this.page.update(p => p - 1); this.res.reload(); },
      error: () => alert('Не удалось удалить (возможно, вы не автор)'),
    });
  }
}
