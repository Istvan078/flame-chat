import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { NotesComponent } from './components/notes/notes.component';
import { SignupComponent } from './components/signup/signup.component';
import { LoginComponent } from './components/login/login.component';
import { UsersComponent } from './components/users/users.component';
import { WeatherComponent } from './components/weather/weather.component';
import { RecipesComponent } from './components/recipes/recipes.component';
import { RecipeEditComponent } from './components/recipes/recipe-edit/recipe-edit.component';
import { RecipeDetailComponent } from './components/recipes/recipe-detail/recipe-detail.component';

const routes: Routes = [
  {path: "", component: HomeComponent},
  {path: "notes", component: NotesComponent},
  {path: "signup", component: SignupComponent},
  {path: "login", component: LoginComponent},
  {path: "users", component: UsersComponent},
  {path: "weather", component: WeatherComponent},
  
  {path: "recipes", component: RecipesComponent, children: [
    {path: "create", component: RecipeEditComponent},
    {path: ":key", component: RecipeDetailComponent},
    {path: ":key/edit", component: RecipeEditComponent}
  ]},
  {path: "**", redirectTo: ""},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
