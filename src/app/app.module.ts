import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from "@angular/common/http";

import { AngularFireModule } from "@angular/fire/compat";
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { AngularFirestoreModule } from "@angular/fire/compat/firestore";
import { AngularFireAuthModule } from "@angular/fire/compat/auth";
import { Environments } from './environments';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";


import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { NavComponent } from './components/nav/nav.component';
import { NotesComponent } from './components/notes/notes.component';
import { SignupComponent } from './components/signup/signup.component';
import { FilterPipe } from './pipes/filter.pipe';
import { ClassPipe } from './pipes/class.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './components/login/login.component';
import { UsersComponent } from './components/users/users.component';
import { WeatherComponent } from './components/weather/weather.component';
import { RecipesComponent } from './components/recipes/recipes.component';
import { RecipeDetailComponent } from './components/recipes/recipe-detail/recipe-detail.component';
import { RecipeEditComponent } from './components/recipes/recipe-edit/recipe-edit.component';
import { RecipeListComponent } from './components/recipes/recipe-list/recipe-list.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavComponent,
    NotesComponent,
    SignupComponent,
    FilterPipe,
    ClassPipe,
    LoginComponent,
    UsersComponent,
    WeatherComponent,
    RecipesComponent,
    RecipeDetailComponent,
    RecipeEditComponent,
    RecipeListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AngularFireModule.initializeApp(Environments.firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AngularFirestoreModule,
    BrowserAnimationsModule,
    
    MatFormFieldModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatInputModule,
    MatTooltipModule
    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
