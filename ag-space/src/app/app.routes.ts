import { Routes } from '@angular/router';
import { DashboardShellComponent } from './layout/dashboard-shell/dashboard-shell.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard],
  },
  {
    path: 'todos',
    loadChildren: () => import('./features/todo/todo.routes').then((m) => m.TODO_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
