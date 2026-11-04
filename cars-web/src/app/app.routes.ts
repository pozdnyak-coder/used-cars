import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { CarListComponent } from './car-list.component';
import { CarDetailComponent } from './car-detail.component';
import { CarFormComponent } from './car-form.component';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { NotFoundComponent } from './not-found.component';

export const routes: Routes = [
  { path: '', component: CarListComponent },
  { path: 'cars/new', component: CarFormComponent, canActivate: [authGuard] },
  { path: 'cars/:id/edit', component: CarFormComponent, canActivate: [authGuard] },
  { path: 'cars/:id', component: CarDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', component: NotFoundComponent },
];
