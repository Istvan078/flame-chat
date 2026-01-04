import { Routes } from '@angular/router';
import { UsersComponent } from './components/users/users.component';
import { isAdminGuard } from './guards/is-admin.guard';
import { loggedInRedirectGuard } from './guards/logged-in-redirect.guard';
import { MainMenuComponent } from './components/chat/main-menu/main-menu.component';

export const routes: Routes = [
  {
    path: 'signup',
    canMatch: [loggedInRedirectGuard],
    loadComponent: () =>
      import('./components/signup/signup.component').then(
        mod => mod.SignupComponent
      ),
  },
  {
    path: 'login',
    canMatch: [loggedInRedirectGuard],
    loadComponent: () =>
      import('./components/login/login.component').then(
        mod => mod.LoginComponent
      ),
  },
  { path: 'users', component: UsersComponent, canActivate: [isAdminGuard] },
  {
    path: 'profile/:uid',
    canMatch: [loggedInRedirectGuard],
    loadComponent: () =>
      import('./components/user-profile/user-profile.component').then(
        mod => mod.UserProfileComponent
      ),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin/admin.component').then(
        mod => mod.AdminComponent
      ),
    canActivate: [isAdminGuard],
  },
  { path: 'main-menu', component: MainMenuComponent },
  {
    path: '',
    canMatch: [loggedInRedirectGuard],
    loadChildren: () =>
      import('./components/chat/chat.module').then(m => m.ChatModule),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
