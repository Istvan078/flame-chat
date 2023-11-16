import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { NotesComponent } from './components/notes/notes.component';
import { SignupComponent } from './components/signup/signup.component';
import { LoginComponent } from './components/login/login.component';
import { UsersComponent } from './components/users/users.component';
import { WeatherComponent } from './components/weather/weather.component';

const routes: Routes = [
  {path: "", component: HomeComponent},
  {path: "notes", component: NotesComponent},
  {path: "signup", component: SignupComponent},
  {path: "login", component: LoginComponent},
  {path: "users", component: UsersComponent},
  {path: "weather", component: WeatherComponent},
  {path: "**", redirectTo: ""},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
