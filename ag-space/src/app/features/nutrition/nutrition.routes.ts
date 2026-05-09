import { Routes } from '@angular/router';

// Nutrition feature routes

export const NUTRITION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/nutrition-dashboard/nutrition-dashboard.page').then(m => m.NutritionDashboardPage),
  },
  {
    path: 'add',
    loadComponent: () => import('./pages/add-meal/add-meal.page').then(m => m.AddMealPage),
  },
  {
    path: 'review',
    loadComponent: () => import('./pages/meal-review/meal-review.page').then(m => m.MealReviewPage),
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/meal-history/meal-history.page').then(m => m.MealHistoryPage),
  },
  {
    path: 'goals',
    loadComponent: () => import('./pages/profile-goals/profile-goals.page').then(m => m.ProfileGoalsPage),
  },
];
