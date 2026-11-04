import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav>
      <a routerLink="/"><strong>AutoMarket</strong></a>
      <span class="spacer"></span>
      @if (auth.isLoggedIn()) {
        <a routerLink="/cars/new">+ Добавить</a>
        <span>{{ auth.username() }}</span>
        <button type="button" (click)="logout()">Выйти</button>
      } @else {
        <a routerLink="/login">Вход</a>
        <a routerLink="/register">Регистрация</a>
      }
    </nav>
    <main><router-outlet /></main>
  `,
})
export class App {
  auth = inject(AuthService);
  private router = inject(Router);
  logout() { this.auth.logout(); this.router.navigateByUrl('/'); }
}
