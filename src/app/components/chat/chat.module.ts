import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { ChatComponent } from './chat.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { ToastComponent } from '../toast/toast.component';
import { MainMenuModalComponent } from '../modals/main-menu-modal/main-menu-modal.component';
import { chatRoutes } from './chat.routes';

// HA NINCS DISPLAYNAME A USERNEK NEM LÉPHET BE A CHAT ÚTVONALRA //
// Visszanavigálom profillétrehozó felületre
// const chatCanActivate: CanActivateFn = (route, state) => {
//   const router = inject(Router);
//   if (route.params['uid']) {
//     router.navigate(['/profile/' + route.params['uid']]);
//     return false;
//   }
//   return true;
// };

@NgModule({
  declarations: [ChatComponent, ToastComponent, MainMenuModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [SharedModule, RouterModule.forChild(chatRoutes)],
  exports: [],
})
export class ChatModule {}
