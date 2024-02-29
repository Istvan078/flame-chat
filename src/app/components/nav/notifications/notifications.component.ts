import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { BaseService } from 'src/app/services/base.service';

class Friend {
  displayName: string = '';
  email: string = '';
  friendId: string = '';
  friendKey: string = '';
  profilePicture: string = '';
  seenMe: boolean = false;
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements AfterViewInit {
  @ViewChild('sidenav') sideNav!: MatSidenav;
  @Input() sideNavToggle: boolean = false;
  @Output() sideNavToggleToNav: EventEmitter<boolean> = new EventEmitter();
  opened: boolean = false;
  friendsSeenMe: any[] = [];
  newMessages: any[] = [];
  lastFriendSeenMe: Friend = new Friend();
  lastNewMessage: any = {};
  sideNavOn: boolean = true;
  backToChats: boolean = false;
  @Input() toVisitedMeOn: boolean = false;
  @Output() compOfNoti: EventEmitter<boolean> = new EventEmitter();
  @Output() allNotifications: EventEmitter<number> = new EventEmitter();

  constructor(private base: BaseService) {}

  ngAfterViewInit(): void {
    this.base.newMessageNotiSubject.subscribe((nM) => {
      this.newMessages = nM
      this.allNotifications.emit(this.friendsSeenMe.length + this.newMessages.length);
      const copyOfNewMessages = [...this.newMessages]
      this.lastNewMessage = copyOfNewMessages.pop()
    })
    this.base.profileSeenSubject.subscribe((fr) => {
      if (fr.length != 0) {
        this.friendsSeenMe = fr.filter((fr: any) => fr.seenMe === true);
        const copyOfFriendsSeenMe = [...this.friendsSeenMe];
        this.allNotifications.emit(this.friendsSeenMe.length);
        // utolsó barát aki megnézte a profilomat
        this.lastFriendSeenMe = copyOfFriendsSeenMe.pop();
      }
    });
  }

  toVisitedMe() {
    this.backToChats = false;
    this.sideNavToggle = !this.sideNavToggle;
    this.toVisitedMeOn = true;
    this.base.logicalSubject.next(this.toVisitedMeOn);
    this.compOfNoti.emit(this.toVisitedMeOn);
    this.sideNavToggleToNav.emit(this.sideNavToggle);
  }
}
