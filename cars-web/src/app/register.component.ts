import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { fieldMessage } from './form-utils';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1>Регистрация</h1>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <label>Логин
        <input formControlName="username" autocomplete="username" />
        <small class="error">{{ msg('username') }}</small>
      </label>
      <label>Пароль
        <input type="password" formControlName="password" autocomplete="new-password" />
        <small class="error">{{ msg('password') }}</small>
      </label>
      @if (formError()) { <p class="error">{{ formError() }}</p> }
      <button type="submit" [disabled]="saving()">Зарегистрироваться</button>
    </form>
    <p>Уже есть аккаунт? <a routerLink="/login">Войти</a></p>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

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
    this.auth.register(username, password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        if (err.status === 400 && err.error?.errors) {
          // ошибки сервера — под нужным полем
          for (const [field, messages] of Object.entries<string[]>(err.error.errors)) {
            this.form.get(field)?.setErrors({ server: messages[0] });
            this.form.get(field)?.markAsTouched();
          }
        } else {
          this.formError.set('Ошибка сервера');
        }
      },
    });
  }
}
