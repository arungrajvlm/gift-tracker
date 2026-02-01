import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
    },
    {
        path: 'detail/:id',
        loadComponent: () => import('./pages/chat-detail/chat-detail.page').then(m => m.ChatDetailPage)
    },
    {
        path: 'add-contact',
        loadComponent: () => import('./pages/add-contact/add-contact.page').then(m => m.AddContactPage)
    },
    {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage)
    },
    {
        path: 'about',
        loadComponent: () => import('./pages/about/about.page').then(m => m.AboutPage)
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
];
