import { ViewportScroller } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Chat } from 'src/app/models/chat.model';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('spanAnchor') toCreated!: ElementRef;
  users: Chat[] = [];
  isSAdmin: boolean = false;
  message: Chat = new Chat();
  messages: Chat[] = [];
  editMessage: boolean = false;
  updateMessageKey: string = '';
  userObject!: UserClass;
  userProfiles: UserClass[] = [];
  userProfile: UserClass[] = [];
  count: number = 0;

  user: {
    messageId: string;
    userId: string;
    displayName: string;
    email: string;
  } = {
    messageId: '',
    userId: '',
    displayName: '',
    email: '',
  };

  userLoggedInSubscription!: Subscription;
  isSuperAdminSubscription!: Subscription;
  usersSubscription!: Subscription;

  constructor(
    private auth: AuthService,
    private base: BaseService,
    private viewPortScroller: ViewportScroller,
    private router: Router
  ) {}

  ngOnInit() {
    setTimeout(() => {
      // this.base.refChats.query.orderByValue().on('value', (
      //   (adat) => {this.messages.push(adat.val())
      //   console.log(this.messages)
      //   }
      // ))

      this.base.getMessages().subscribe((messages: any[]) => {
        if (this.messages.length === 0) {
          for (let message of messages) {
            if (message.uid === this.user.userId) {
              this.user.messageId = message.uid;
            }
            message.id = message['key'];
            message.id = message.uid;
            this.count = Math.max(message.count);

            this.messages = messages;
            this.base.updateMessage(message['key'], message);
          }
        }
      });

      this.userLoggedInSubscription = this.auth.userLoggedInSubject.subscribe(
        (user: any) => {
          this.base.getUserProfiles().subscribe((userProfiles: any[]) => {
            this.userProfiles = userProfiles;
            this.userProfile = userProfiles.filter(
              (userProfile: any) => userProfile.uid === user.uid
            );

            this.user.userId = this.userProfile[0].uid;
            this.user.displayName = this.userProfile[0].displayName!;
            this.user.email = this.userProfile[0].email!;
          });
        }
      );

      // this.usersSubscription = this.auth
      //   .getUsersSubject()
      //   .subscribe((users: any) => {
      //     this.users = users;
      //     this.users.forEach((user) => {
      //       if (user.displayName === '') {
      //         user.displayName = 'Névtelen felhasználó';
      //       }
      //       if (user.email === '') {
      //         user.email = 'Nincs regisztrált e-mail cím';
      //       }
      //     });
      //   });
    }, 2000);
    this.isSuperAdminSubscription = this.auth.isSuperAdmin.subscribe(
      (value) => (this.isSAdmin = value)
    );
  }

  addMessage() {
    if (!this.message.uid) {
      this.message.uid = this.user.userId;
    }
    let date = new Date();
    let dateString =
      date.toLocaleDateString() + '  ' + date.toLocaleTimeString();
    this.message.date = dateString;
    this.message.displayName = this.userProfile[0].displayName;
    this.message.email = this.userProfile[0].email;
    console.log(this.count);
    this.message.count = this.count + 1;
    this.count++;
    this.message['profilePicture'] = this.userProfile[0].profilePicture;

    this.base.addMessage(this.message);
    this.base.getMessages().subscribe((messages: any[]) => {
      this.messages = messages;
    });

    // let dynamicAnchorId = this.toCreated.nativeElement.id
    // this.router.navigate([], {fragment: dynamicAnchorId})
  }

  clearInput() {
    this.message.message = '';
  }

  deleteMessage(message: Chat) {
    this.base
      .deleteMessage(message)
      .then((res) =>
        this.base
          .getMessages()
          .subscribe((messages: any[]) => (this.messages = messages))
      );
  }

  deleteMessages() {
    this.base.deleteMessages();
  }

  navigateToUpdateMessage(message: Chat) {
    this.updateMessageKey = message['key'] as string;
    this.editMessage = true;
    this.message.message = message.message;
    this.viewPortScroller.scrollToPosition([0, 0]);
  }

  updateMessage() {
    if (!this.message.uid) {
      this.message.uid = this.user.userId;
    }
    let date = new Date();
    let dateString =
      date.toLocaleDateString() + '  ' + date.toLocaleTimeString();
    this.message.date = dateString;
    this.message.displayName = this.userProfile[0].displayName;
    this.message.email = this.userProfile[0].email;
    this.message['profilePicture'] = this.userProfile[0].profilePicture;
    this.message.displayName = this.userProfile[0].displayName;
    this.base.updateMessage(this.updateMessageKey, this.message);
    this.base
      .getMessages()
      .subscribe((messages: any[]) => (this.messages = messages));
    this.viewPortScroller.scrollToAnchor(this.updateMessageKey);
    this.editMessage = false;
  }

  ngOnDestroy(): void {
    if (this.userLoggedInSubscription) {
      this.userLoggedInSubscription.unsubscribe();
    }
    if (this.isSuperAdminSubscription) {
      this.isSuperAdminSubscription.unsubscribe();
    }
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
  }
}
