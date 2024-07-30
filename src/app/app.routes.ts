import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SignupComponent } from './components/signup/signup.component';
import { LoginComponent } from './components/login/login.component';
import { UsersComponent } from './components/users/users.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { loginGuard } from './guards/login.guard';
import { MyPostsComponent } from './components/chat/my-posts/my-posts.component';
import { AdminComponent } from './components/admin/admin.component';
import { isAdminGuard } from './guards/is-admin.guard';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  { path: 'users', component: UsersComponent, canActivate: [isAdminGuard] },
  {
    path: 'profile/:uid',
    component: UserProfileComponent,
    canActivate: [loginGuard],
  },
  { path: 'my-posts', component: MyPostsComponent, canActivate: [loginGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [isAdminGuard] },
  {
    path: '',
    canActivate: [loginGuard],
    loadChildren: () =>
      import('./components/chat/chat.module').then(m => m.ChatModule),
  },
];
