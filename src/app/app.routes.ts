import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'movies',
        loadComponent: () => import('./pages/movies/movies.page').then((m) => m.MoviesPage),
      },
      {
        path: 'playlist',
        loadComponent: () => import('./pages/playlist/playlist.page').then((m) => m.PlaylistPage),
      },
      {
        path: 'matching',
        loadComponent: () => import('./pages/matching/matching.page').then((m) => m.MatchingPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/admin/admin.page').then((m) => m.AdminPage),
      },
      { path: '', redirectTo: 'movies', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'tabs/movies', pathMatch: 'full' },
  { path: '**', redirectTo: 'tabs/movies' },
];
