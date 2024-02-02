import { NgModule } from '@angular/core';
import { ChatComponent } from './chat.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { NewsComponent } from './news/news.component';
import { ModalComponent } from '../modals/modal/modal.component';
import { loginGuardGuard } from 'src/app/guards/login-guard.guard';

@NgModule({
  declarations: [ChatComponent, UserProfileComponent, NewsComponent],
  imports: [
    
    SharedModule,
    RouterModule.forChild([
      { path: '', component: ChatComponent, canActivate: [loginGuardGuard] },
      // { path: ':uid', component: ChatComponent },
      { path: '**', component: ChatComponent, canActivate: [loginGuardGuard] },
    ]),
  ],
  exports: [
    RouterModule
  ]
})
export class ChatModule {}
