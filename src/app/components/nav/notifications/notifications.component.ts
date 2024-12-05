import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { BaseService } from 'src/app/services/base.service';
import { FirestoreService } from 'src/app/services/firestore.service';

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
  newMyPosts: number = 0;
  sideNavOn: boolean = true;
  backToChats: boolean = false;
  @Input() toVisitedMeOn: boolean = false;
  @Output() compOfNoti: EventEmitter<boolean> = new EventEmitter();
  @Output() allNotifications: EventEmitter<number> = new EventEmitter();

  constructor(
    private base: BaseService,
    private firestoreService: FirestoreService,
    private router: Router
  ) {}

  ngAfterViewInit(): void {
    this.firestoreService.getMyPostsNotiSubj().subscribe(num => {
      this.newMyPosts = num;
      this.allNotifications.emit(
        this.newMyPosts + this.newMessages.length + this.friendsSeenMe.length
      );
    });
    this.base.newMessageNotiSubject.subscribe(nM => {
      this.newMessages = nM;
      this.allNotifications.emit(
        this.friendsSeenMe.length + this.newMessages.length + this.newMyPosts
      );
      const copyOfNewMessages = [...this.newMessages];
      this.lastNewMessage = copyOfNewMessages.pop();
    });
    this.base.profileSeenSubject.subscribe(fr => {
      // if (fr.length != 0) {
      this.friendsSeenMe = fr.filter((fr: any) => fr.seenMe === true);
      const copyOfFriendsSeenMe = [...this.friendsSeenMe];
      this.allNotifications.emit(
        this.friendsSeenMe.length + this.newMyPosts + this.newMessages.length
      );
      // utolsó barát aki megnézte a profilomat
      this.lastFriendSeenMe = copyOfFriendsSeenMe.pop();
      // }
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
  toNewMessage(newMess: any) {
    const friendId = newMess.friendId;
    this.newMessages = this.newMessages.filter(
      nM => nM.friendId !== newMess.friendId
    );
    this.base.newMessageNotiSubject.next(this.newMessages);
    this.sideNavToggle = !this.sideNavToggle;
    this.base.messageTransferSub.next(true);
    this.sideNavToggleToNav.emit(this.sideNavToggle);
    this.router.navigate([`/message/${friendId}`]);
  }

  toMyPosts() {
    this.router.navigate(['/my-posts']);
  }
}
