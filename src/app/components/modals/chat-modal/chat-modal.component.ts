import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-chat-modal',
  standalone: true,
  imports: [],
  templateUrl: './chat-modal.component.html',
  styleUrl: './chat-modal.component.scss',
})
export class ChatModalComponent {
  @Input() message: any;
  @Input() reactionsArr: any[] = [];
  @Output() reactionSelected = new EventEmitter<any>();

  setReactionForMsg(reaction: any) {
    console.log('Reaction selected:', reaction);
    this.reactionSelected.emit( reaction );
  }
}
