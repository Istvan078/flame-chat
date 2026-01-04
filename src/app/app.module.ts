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
import { NavComponent } from './components/nav/nav.component';
import { ClassPipe } from './pipes/class.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UsersComponent } from './components/users/users.component';
import { LoadingSpinnerComponent } from './shared/loading-spinner.component';

import { SharedModule } from './components/shared/shared.module';
import { ModalComponent } from './components/modals/modal/modal.component';
import { NotificationsComponent } from './components/nav/notifications/notifications.component';
import { VisitedMeComponent } from './components/nav/notifications/visited-me/visited-me.component';
import { FilesModalComponent } from './components/modals/files-modal/files-modal.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MatModalComponent } from './components/modals/mat-modal/mat-modal.component';
import { LocationComponent } from './components/users/location/location.component';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { MainMenuComponent } from './components/chat/main-menu/main-menu.component';

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
  providers: [NgbTooltipConfig, provideHttpClient(withInterceptorsFromDi())],
})
export class AppModule {}
