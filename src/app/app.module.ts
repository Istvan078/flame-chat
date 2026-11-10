import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import {
  NgbModalModule,
  NgbTooltipConfig,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { NavComponent } from './shell/nav/nav.component';
import { ClassPipe } from './shared/pipes/class.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UsersComponent } from './features/admin/users/users.component';
import { LoadingSpinnerComponent } from './shared/loading-spinner.component';

import { SharedModule } from './shared/shared.module';
import { ModalComponent } from './shared/ui/modal/modal.component';
import { NotificationsComponent } from './features/notifications/notifications/notifications.component';
import { VisitedMeComponent } from './features/notifications/visited-me/visited-me.component';
import { FilesModalComponent } from './shared/ui/files-modal/files-modal.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MatModalComponent } from './shared/ui/mat-modal/mat-modal.component';
import { LocationComponent } from './features/admin/location/location.component';
import { BottomNavComponent } from './shell/bottom-nav/bottom-nav.component';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { MainMenuComponent } from './shell/main-menu/main-menu.component';
import { IonApp, IonRouterOutlet, provideIonicAngular } from '@ionic/angular';

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    ClassPipe,
    UsersComponent,
    LocationComponent,
    LoadingSpinnerComponent,
    ModalComponent,
    NotificationsComponent,
    VisitedMeComponent,
    FilesModalComponent,
    MatModalComponent,
    BottomNavComponent,
    MainMenuComponent,
  ],
  bootstrap: [AppComponent], // melyik komponenssel inditsa az appot
  imports: [
    IonApp,
    IonRouterOutlet,
    BrowserModule,
    TranslateModule.forRoot({
      fallbackLang: 'hu',
      loader: provideTranslateHttpLoader({
        prefix: 'assets/i18n/',
        suffix: '.json',
      }),
    }),
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
    }),
  ],
  providers: [
    NgbTooltipConfig,
    provideHttpClient(withInterceptorsFromDi()),
    provideIonicAngular(),
  ],
})
export class AppModule {}
