import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { fieldMessage } from './form-utils';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1>Вход</h1>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <label>Логин
        <input formControlName="username" autocomplete="username" />
        <small class="error">{{ msg('username') }}</small>
      </label>
      <label>Пароль
        <input type="password" formControlName="password" autocomplete="current-password" />
        <small class="error">{{ msg('password') }}</small>
      </label>
      @if (formError()) { <p class="error">{{ formError() }}</p> }
      <button type="submit" [disabled]="saving()">Войти</button>
    </form>
    <p>Нет аккаунта? <a routerLink="/register">Регистрация</a></p>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  returnUrl = input<string>();          // ?returnUrl=... (withComponentInputBinding)
  saving = signal(false);
  formError = signal('');

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  msg(name: string) { return fieldMessage(this.form.get(name)); }

  submit() {
    this.formError.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { username, password } = this.form.getRawValue();
    this.saving.set(true);
    this.auth.login(username, password).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl() || '/'),
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(err.status === 401 ? 'Неверный логин или пароль' : 'Ошибка сервера');
      },
    });
  }
}
