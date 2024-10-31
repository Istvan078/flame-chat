import { inject, NgModule } from '@angular/core';
import { ChatComponent } from './chat.component';
import { SharedModule } from '../shared/shared.module';
import { CanActivateFn, Router, RouterModule } from '@angular/router';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { NewsComponent } from './news/news.component';
import { FriendProfileComponent } from '../user-profile/friend-profile/friend-profile.component';
import { AlbumComponent } from './album/album.component';
import { MyPostsComponent } from './my-posts/my-posts.component';
import { ToastComponent } from '../toast/toast.component';
import { PostsComponent } from './shared/posts/posts.component';
import { MessageComponent } from './message/message.component';
import { MessagedFriendsComponent } from './messaged-friends/messaged-friends.component';

// HA NINCS DISPLAYNAME A USERNEK NEM LÉPHET BE A CHAT ÚTVONALRA //
// Visszanavigálom profillétrehozó felületre
const chatCanActivate: CanActivateFn = (route, state) => {
  const router = inject(Router);
  if (route.params['uid']) {
    router.navigate(['/profile/' + route.params['uid']]);
    return false;
  }
  return true;
};

@NgModule({
  declarations: [
    ChatComponent,
    UserProfileComponent,
    FriendProfileComponent,
    AlbumComponent,
    MyPostsComponent,
    NewsComponent,
    ToastComponent,
    PostsComponent,
    MessageComponent,
    MessagedFriendsComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      { path: '', component: ChatComponent },
      {
        path: 'chat/:uid',
        component: ChatComponent,
        canActivate: [chatCanActivate],
      },
      {
        path: 'message',
        component: MessagedFriendsComponent
      },
      {
        path: 'message/:friendId',
        component: MessageComponent,
      },
      {
        path: 'album/:uid',
        component: AlbumComponent,
      },
      {
        path: ':uid/friend-profile',
        component: FriendProfileComponent,
      },
      { path: '**', component: ChatComponent },
    ]),
  ],
  exports: [RouterModule],
})
export class ChatModule {}
