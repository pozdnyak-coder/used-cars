import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { AuthResponse } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private session = signal<AuthResponse | null>(this.load());

  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly userId = computed(() => this.session()?.userId ?? null);
  readonly username = computed(() => this.session()?.username ?? null);
  readonly token = computed(() => this.session()?.token ?? null);

  login(username: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/login', { username, password })
      .pipe(tap(r => this.save(r)));
  }

  register(username: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/register', { username, password })
      .pipe(tap(r => this.save(r)));
  }

  logout() {
    localStorage.removeItem('session');
    this.session.set(null);
  }

  private save(r: AuthResponse) {
    localStorage.setItem('session', JSON.stringify(r));
    this.session.set(r);
  }

  private load(): AuthResponse | null {
    try { return JSON.parse(localStorage.getItem('session') ?? 'null'); } catch { return null; }
  }
}
