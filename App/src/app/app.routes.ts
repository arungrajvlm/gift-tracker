import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/splash/splash.page').then(m => m.SplashPage)
    },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
        canActivate: [LoginGuard]
    },
    {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
        canActivate: [AuthGuard]
    },
    {
        path: 'detail/:id',
        loadComponent: () => import('./pages/chat-detail/chat-detail.page').then(m => m.ChatDetailPage),
        canActivate: [AuthGuard]
    },
    {
        path: 'add-contact',
        loadComponent: () => import('./pages/add-contact/add-contact.page').then(m => m.AddContactPage),
        canActivate: [AuthGuard]
    },
    {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
        canActivate: [AuthGuard]
    },
    {
        path: 'about',
        loadComponent: () => import('./pages/about/about.page').then(m => m.AboutPage),
        canActivate: [AuthGuard]
    },
];
