import { Routes } from '@angular/router';
import { SignupComponent } from './components/signup/signup.component';
import { LoginComponent } from './components/login/login.component';
import { UsersComponent } from './components/users/users.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { MyPostsComponent } from './components/chat/my-posts/my-posts.component';
import { AdminComponent } from './components/admin/admin.component';
import { isAdminGuard } from './guards/is-admin.guard';
import { loggedInRedirectGuard } from './guards/logged-in-redirect.guard';

export const routes: Routes = [
  {
    path: 'signup',
    canActivate: [loggedInRedirectGuard],
    component: SignupComponent,
  },
  {
    path: 'login',
    canActivate: [loggedInRedirectGuard],
    component: LoginComponent,
  },
  { path: 'users', component: UsersComponent },
  {
    path: 'profile/:uid',
    component: UserProfileComponent,
  },
  { path: 'my-posts', component: MyPostsComponent },
  { path: 'admin', component: AdminComponent, canActivate: [isAdminGuard] },
  {
    path: '',
    canActivate: [loggedInRedirectGuard],
    loadChildren: () =>
      import('./components/chat/chat.module').then(m => m.ChatModule),
  },
];
