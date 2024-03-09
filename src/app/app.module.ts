import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";

import { AngularFireModule } from "@angular/fire/compat";
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFirestoreModule } from "@angular/fire/compat/firestore";
import { AngularFireAuthModule } from "@angular/fire/compat/auth";
import { AngularFireMessagingModule } from "@angular/fire/compat/messaging";
import { Environments } from './environments';

import {  NgbModalModule, NgbTooltipConfig, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { NavComponent } from './components/nav/nav.component';
import { NotesComponent } from './components/notes/notes.component';
import { SignupComponent } from './components/signup/signup.component';
import { ClassPipe } from './pipes/class.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './components/login/login.component';
import { UsersComponent } from './components/users/users.component';
import { WeatherComponent } from './components/weather/weather.component';
//  import { AuthInterceptorService } from './services/auth-interceptor.service';
 import { LoggingInterceptorService } from './services/logging-interceptor.service';
import { LoadingSpinnerComponent } from './shared/loading-spinner.component';

import { SharedModule } from './components/shared/shared.module';
import { ModalComponent } from './components/modals/modal/modal.component';
import { NotificationsComponent } from './components/nav/notifications/notifications.component';
import { VisitedMeComponent } from './components/nav/notifications/visited-me/visited-me.component';
import { FilesModalComponent } from './components/modals/files-modal/files-modal.component';
import { ServiceWorkerModule } from '@angular/service-worker';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavComponent,
    NotesComponent,
    SignupComponent,
    ClassPipe,
    LoginComponent,
    UsersComponent,
    WeatherComponent,
    LoadingSpinnerComponent,
    ModalComponent,
    NotificationsComponent,
    VisitedMeComponent,
    FilesModalComponent,  
  
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
   
    
    ReactiveFormsModule,
    HttpClientModule,
    AngularFireModule.initializeApp(Environments.firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireMessagingModule,
    BrowserAnimationsModule,
    
    SharedModule,


    NgbTooltipModule,
    NgbModalModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:10000'
    })
    
  ],
  providers: [
    // {provide: HTTP_INTERCEPTORS,
    //  useClass: AuthInterceptorService, 
    //  multi: true},
     {provide: HTTP_INTERCEPTORS,
      useClass: LoggingInterceptorService, 
      multi: true},
      NgbTooltipConfig,
    ],
    
  bootstrap: [AppComponent]
})
export class AppModule { }
