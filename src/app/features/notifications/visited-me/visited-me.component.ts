import { PeopleService } from 'src/app/features/people/people.service';
import { MessagesService } from 'src/app/features/messaging/messages.service';
import { inject, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Chat } from 'src/app/features/messaging/chat.model';
import { UtilityService } from 'src/app/services/utility.service';

@Component({
  selector: 'app-visited-me',
  templateUrl: './visited-me.component.html',
  styleUrls: ['./visited-me.component.scss'],
  standalone: false,
})
export class VisitedMeComponent implements OnInit {
  private messagesService = inject(MessagesService);

  @Input() friendsSeenMe: any[] = [];
  @Input() newMessages: any[] = [];
  friendsSeenMee: any[] = [];
  @Output() backToChats: EventEmitter<boolean> = new EventEmitter();
  constructor(
    private base: PeopleService,
    private utilityService: UtilityService,
  ) {}

  ngOnInit(): void {
    this.friendsSeenMee = [...this.friendsSeenMe];
  }

  backToChat() {
    const tomb = this.friendsSeenMee.map(f => {
      this.base.updateFriend(
        f.friendKey,
        {
          friendId: f.friendId,
          seenMe: false,
        } as any,
        this.utilityService.userProfile.key,
      );
      return { friendId: f.friendId, seenMe: (f.seenMe = false) };
    });

    this.newMessages.forEach((nM: Chat) => {
      nM.message.seen = true;
      // this.base.updateMessage(nM.key, nM, this.utilityService.userProfile.key); // MEGCSINÁLNI
    });

    this.messagesService.haventSeenMsgsArr.next([]);

    this.base.profileSeenSubject.next(tomb);
    this.messagesService.logicalSubject.next(false);
    this.backToChats.emit(true);
  }
}
