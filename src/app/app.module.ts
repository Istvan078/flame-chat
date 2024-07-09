import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import {
  NgbModalModule,
  NgbTooltipConfig,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { NavComponent } from './components/nav/nav.component';
import { SignupComponent } from './components/signup/signup.component';
import { ClassPipe } from './pipes/class.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './components/login/login.component';
import { UsersComponent } from './components/users/users.component';
import { LoadingSpinnerComponent } from './shared/loading-spinner.component';

import { SharedModule } from './components/shared/shared.module';
import { ModalComponent } from './components/modals/modal/modal.component';
import { NotificationsComponent } from './components/nav/notifications/notifications.component';
import { VisitedMeComponent } from './components/nav/notifications/visited-me/visited-me.component';
import { FilesModalComponent } from './components/modals/files-modal/files-modal.component';
import { ServiceWorkerModule } from '@angular/service-worker';

@NgModule({ declarations: [
        AppComponent,
        HomeComponent,
        NavComponent,
        SignupComponent,
        ClassPipe,
        LoginComponent,
        UsersComponent,
        LoadingSpinnerComponent,
        ModalComponent,
        NotificationsComponent,
        VisitedMeComponent,
        FilesModalComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        SharedModule,
        NgbTooltipModule,
        NgbModalModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: !isDevMode(),
            // Register the ServiceWorker as soon as the application is stable
            // or after 30 seconds (whichever comes first).
            registrationStrategy: 'registerWhenStable:10000',
        })], providers: [NgbTooltipConfig, provideHttpClient(withInterceptorsFromDi())] })
export class AppModule {}
