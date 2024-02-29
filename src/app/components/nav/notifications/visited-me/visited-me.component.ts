import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Chat } from 'src/app/models/chat.model';
import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-visited-me',
  templateUrl: './visited-me.component.html',
  styleUrls: ['./visited-me.component.scss'],
})
export class VisitedMeComponent implements OnInit {
  @Input() friendsSeenMe: any[] = [];
  @Input() newMessages: any[] = [];
  friendsSeenMee: any[] = [];
  @Output() backToChats: EventEmitter<boolean> = new EventEmitter();
  constructor(private base: BaseService) {}

  ngOnInit(): void {
    this.friendsSeenMee = [...this.friendsSeenMe];
  }

  backToChat() {
    const tomb = this.friendsSeenMee.map((f) => {
      console.log(f.seenMe);
      this.base.updateFriend(f.friendKey, {
        friendId: f.friendId,
        seenMe: false,
      } as any);
      console.log('ciklus');
      return {friendId: f.friendId, seenMe: f.seenMe = false}
    });
    console.log(tomb);

    this.newMessages.forEach((nM: Chat) => {
      nM.message.seen = true
      this.base.updateMessage(nM.key, nM)
    })
    
    this.base.profileSeenSubject.next(tomb)
    this.base.logicalSubject.next(false);
    this.backToChats.emit(true);
  }
}
