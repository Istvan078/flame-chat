import {
  Component,
  Inject,
  Input,
  input,
  InputSignal,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Chat, ReplyMessage } from 'src/app/models/chat.model';

@Component({
  selector: 'app-mat-modal',
  templateUrl: './mat-modal.component.html',
  styleUrl: './mat-modal.component.scss',
})
export class MatModalComponent {
  constructor(
    public dialogRef: MatDialogRef<MatModalComponent> // @Inject(MAT_DIALOG_DATA)
  ) {}
  @Input() isUpdateForApp: boolean = false;
  @Input() isPosted: boolean = false;
  @Input() isUnauthorized: boolean = false;
  @Input() isReplyForMessage: boolean = false;
  @Input() oldMessage!: Chat & ReplyMessage;
  @Input() replyMessage!: ReplyMessage;

  sendReplyMessage() {
    this.dialogRef.close('message-sent');
  }
}
