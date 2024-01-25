import { NgModule } from '@angular/core';
import { ChatComponent } from './chat.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [ChatComponent],
  imports: [
    SharedModule,
    RouterModule.forChild([
      { path: '', component: ChatComponent },
      { path: ':uid', component: ChatComponent },
    ]),
  ],
  exports: [
    RouterModule
  ]
})
export class ChatModule {}
