import { AbstractControl } from '@angular/forms';

// Текст ошибки для поля (серверная ошибка имеет приоритет)
export function fieldMessage(c: AbstractControl | null): string {
  if (!c || !(c.touched || c.dirty)) return '';
  const e = c.errors ?? {};
  if (e['server']) return e['server'];
  if (e['required']) return 'Обязательное поле';
  if (e['minlength']) return `Не короче ${e['minlength'].requiredLength} символов`;
  if (e['maxlength']) return `Не длиннее ${e['maxlength'].requiredLength} символов`;
  return '';
}
