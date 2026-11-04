import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `<h1>404</h1><p>Страница не найдена.</p><a routerLink="/">На главную</a>`,
})
export class NotFoundComponent {}
