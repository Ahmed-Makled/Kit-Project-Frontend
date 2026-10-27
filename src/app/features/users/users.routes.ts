import { Routes } from '@angular/router';

export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then((m) => m.UsersLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () => import('./pages/index/index.component').then((m) => m.UsersIndexComponent),
      },
    ],
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/create/create.component').then((m) => m.UserCreateComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/create/create.component').then((m) => m.UserCreateComponent),
  },
];
