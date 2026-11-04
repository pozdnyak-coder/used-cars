import { Injectable, inject } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Brand, Car, CarFilter, CarRequest, Paged } from './models';

export interface ListQuery extends CarFilter { page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class CarsService {
  private http = inject(HttpClient);

  // Чтение — через httpResource
  readonly brands = httpResource<Brand[]>(() => '/api/brands');

  list(query: () => ListQuery) {
    return httpResource<Paged<Car>>(() => {
      const q = query();
      const params: Record<string, string | number> = { page: q.page, pageSize: q.pageSize, sort: q.sort, dir: q.dir };
      if (q.brandId !== null) params['brandId'] = q.brandId;
      if (q.maxPrice !== null) params['maxPrice'] = q.maxPrice;
      if (q.yearFrom !== null) params['yearFrom'] = q.yearFrom;
      return { url: '/api/cars', params };
    });
  }

  one(id: () => number | undefined) {
    return httpResource<Car>(() => {
      const value = id();
      return value ? `/api/cars/${value}` : undefined;
    });
  }

  // Запись — через HttpClient
  create(dto: CarRequest) { return this.http.post<Car>('/api/cars', dto); }
  update(id: number, dto: CarRequest) { return this.http.put<Car>(`/api/cars/${id}`, dto); }
  remove(id: number) { return this.http.delete<void>(`/api/cars/${id}`); }

  upload(id: number, file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<Car>(`/api/cars/${id}/image`, body);
  }
}
