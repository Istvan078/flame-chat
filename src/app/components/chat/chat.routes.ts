import { Routes } from '@angular/router';
import { ChatComponent } from './chat.component';

export const chatRoutes: Routes = [
  { path: 'chat', component: ChatComponent },
  {
    path: 'message',
    loadComponent: () =>
      import('./messaged-friends/messaged-friends.component').then(
        mod => mod.MessagedFriendsComponent
      ),
  },
  {
    path: 'message/:friendId',
    loadComponent: () =>
      import('./message/message.component').then(mod => mod.MessageComponent),
  },
  {
    path: 'my-posts',
    loadComponent: () =>
      import('./my-posts/my-posts.component').then(mod => mod.MyPostsComponent),
  },
  {
    path: 'album/:uid',
    loadComponent: () =>
      import('./album/album.component').then(mod => mod.AlbumComponent),
  },
  {
    path: ':uid/friend-profile',
    loadComponent: () =>
      import('../user-profile/friend-profile/friend-profile.component').then(
        mod => mod.FriendProfileComponent
      ),
  },
  {
    path: 'archived-messages',
    loadComponent: () =>
      import(
        './messaged-friends/archived-messages/archived-messages.component'
      ).then(mod => mod.ArchivedMessagesComponent),
  },
  {
    path: 'feeds',
    loadComponent: () =>
      import('./news/news.component').then(mod => mod.NewsComponent),
  },
  { path: '**', redirectTo: '' },
];
