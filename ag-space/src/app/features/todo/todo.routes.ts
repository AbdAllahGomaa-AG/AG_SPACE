import { Routes } from '@angular/router';

export const TODO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/todo-list/todo-list.page').then(m => m.TodoListPage),
    data: { view: 'all' }
  },
  {
    path: 'today',
    loadComponent: () => import('./pages/todo-today/todo-today.page').then(m => m.TodoTodayPage),
  },
  {
    path: 'upcoming',
    loadComponent: () => import('./pages/todo-upcoming/todo-upcoming.page').then(m => m.TodoUpcomingPage),
  },
  {
    path: 'overdue',
    loadComponent: () => import('./pages/todo-overdue/todo-overdue.page').then(m => m.TodoOverduePage),
  },
  {
    path: 'completed',
    loadComponent: () => import('./pages/todo-completed/todo-completed.page').then(m => m.TodoCompletedPage),
  },
  {
    path: 'category/:id',
    loadComponent: () => import('./pages/todo-list/todo-list.page').then(m => m.TodoListPage),
    data: { view: 'category' }
  },
];
