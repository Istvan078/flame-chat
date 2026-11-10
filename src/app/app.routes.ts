import { Routes } from '@angular/router';
import { UsersComponent } from './features/admin/users/users.component';
import { isAdminGuard } from './features/admin/is-admin.guard';
import { loggedInRedirectGuard } from './guards/logged-in-redirect.guard';
import { MainMenuComponent } from './shell/main-menu/main-menu.component';

export const routes: Routes = [
  {
    path: 'signup',
    canMatch: [loggedInRedirectGuard],
    loadComponent: () =>
      import('./features/auth/signup/signup.component').then(
        mod => mod.SignupComponent,
      ),
  },
  {
    path: 'login',
    canMatch: [loggedInRedirectGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        mod => mod.LoginComponent,
      ),
  },
  { path: 'users', component: UsersComponent, canActivate: [isAdminGuard] },
  {
    path: 'profile/:uid',
    canMatch: [loggedInRedirectGuard],
    loadComponent: () =>
      import('./features/people/user-profile/user-profile.component').then(
        mod => mod.UserProfileComponent,
      ),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin/admin.component').then(
        mod => mod.AdminComponent,
      ),
    canActivate: [isAdminGuard],
  },
  { path: 'main-menu', component: MainMenuComponent },
  {
    path: '',
    canMatch: [loggedInRedirectGuard],
    loadChildren: () =>
      import('./features/home/chat.module').then(m => m.ChatModule),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
