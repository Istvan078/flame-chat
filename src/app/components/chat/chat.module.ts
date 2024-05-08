import { NgModule } from '@angular/core';
import { ChatComponent } from './chat.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { NewsComponent } from './news/news.component';
import { ModalComponent } from '../modals/modal/modal.component';
import { loginGuardGuard } from 'src/app/guards/login-guard.guard';
import { FriendProfileComponent } from '../user-profile/friend-profile/friend-profile.component';

@NgModule({
  declarations: [
    ChatComponent,
    UserProfileComponent,
    NewsComponent,
    FriendProfileComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      { path: '', component: ChatComponent },
      { path: ':uid/friend-profile', component: FriendProfileComponent },
      { path: '**', component: ChatComponent },
    ]),
  ],
  exports: [RouterModule],
})
export class ChatModule {}
