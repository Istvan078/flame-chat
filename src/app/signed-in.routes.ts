import { Routes } from '@angular/router';
import { ChatComponent } from './features/home/chat.component';

export const chatRoutes: Routes = [
  { path: 'chat', component: ChatComponent },
  {
    path: 'message',
    loadComponent: () =>
      import('./features/messaging/messaged-friends/messaged-friends.component').then(
        mod => mod.MessagedFriendsComponent,
      ),
  },
  {
    path: 'message/:friendId',
    loadComponent: () =>
      import('./features/messaging/message/message.component').then(
        mod => mod.MessageComponent,
      ),
  },
  {
    path: 'my-posts',
    loadComponent: () =>
      import('./features/posts/my-posts/my-posts.component').then(mod => mod.MyPostsComponent),
  },
  {
    path: 'album/:uid',
    loadComponent: () =>
      import('./features/people/album/album.component').then(mod => mod.AlbumComponent),
  },
  {
    path: ':uid/friend-profile',
    loadComponent: () =>
      import('./features/people/friend-profile/friend-profile.component').then(
        mod => mod.FriendProfileComponent,
      ),
  },
  {
    path: 'archived-messages',
    loadComponent: () =>
      import('./features/messaging/messaged-friends/archived-messages/archived-messages.component').then(
        mod => mod.ArchivedMessagesComponent,
      ),
  },
  {
    path: 'feeds',
    loadComponent: () =>
      import('./features/posts/news/news.component').then(mod => mod.NewsComponent),
  },
  { path: '**', redirectTo: '' },
];
