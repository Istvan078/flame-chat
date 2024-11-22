import { Component, Input, input, InputSignal, ViewChild } from '@angular/core';
import { Chat, ReplyMessage } from 'src/app/models/chat.model';

@Component({
  selector: 'app-mat-modal',
  templateUrl: './mat-modal.component.html',
  styleUrl: './mat-modal.component.scss',
})
export class MatModalComponent {
  @Input() isUpdateForApp: boolean = false;
  @Input() isPosted: boolean = false;
  @Input() isUnauthorized: boolean = false;
  @Input() isReplyForMessage: boolean = false;
  @Input() oldMessage!: Chat & ReplyMessage;
  @Input() replyMessage!: ReplyMessage;
}
