export interface Brand { id: number; name: string; }

export interface Car {
  id: number; model: string; year: number; mileage: number; price: number;
  color: string; brandId: number; brandName: string; ownerId: number; imageUrl: string | null;
}

export interface CarRequest {
  model: string; year: number; mileage: number; price: number; color: string; brandId: number;
}

export interface Paged<T> { items: T[]; page: number; pageSize: number; total: number; }

export interface CarFilter {
  brandId: number | null; maxPrice: number | null; yearFrom: number | null;
  sort: string; dir: string;
}

export interface AuthResponse { token: string; userId: number; username: string; }
