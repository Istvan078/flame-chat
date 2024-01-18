import { JsonPipe, ViewportScroller } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AngularFireDatabase,
  AngularFireList,
} from '@angular/fire/compat/database';
import { Router } from '@angular/router';
import { ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { Subject, Subscription, map } from 'rxjs';
import { Chat } from 'src/app/models/chat.model';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { MatAccordion } from '@angular/material/expansion';
import { MAT_DIALOG_DATA, MatDialog, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';

type Friend = {
  uid: string;
  displayName: string;
  email: string;
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('spanAnchor') toCreated!: ElementRef;
  @ViewChild(MatAccordion) accordion!: MatAccordion;

  users: Chat[] = [];
  signAsFriend: UserClass = new UserClass();
  isSAdmin: boolean = false;
  message: Chat = new Chat();
  messages: Chat[] = [];
  editMessage: boolean = false;
  friendsOn: boolean = false;
  sendPrivateMessageOn: boolean = false;
  updateMessageKey: string = '';
  userObject!: UserClass;
  userProfiles: UserClass[] = [];
  userProfile: UserClass[] = [];
  count: number = 0;
  searchWord: string = '';
  refFriends!: AngularFireList<UserClass>;
  eredmeny: any;
  isFriend: boolean = false;
  messageButtonsOn: boolean = false;
  messageButtonClicked: boolean = false;

  userNotFriends: any[] = [];
  userFriends: any[] = [];

  signedFriend: Friend = {
    uid: '',
    email: '',
    displayName: '',
  };

  selectedFriend: any[] = [];
  friendMessages: any[] = [];

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
    public dialog: MatDialog,
    private ngbTooltipConfig: NgbTooltipConfig,
    private realTimeDatabase: AngularFireDatabase,
    private auth: AuthService,
    private base: BaseService,
    private viewPortScroller: ViewportScroller,
    private router: Router
  ) {
    ngbTooltipConfig.animation = true;
    ngbTooltipConfig.closeDelay = 2000;
  }

  addFriends(data: UserClass[]) {
   return this.refFriends.push(data as unknown as UserClass);
  }

  ngOnInit() {
    setTimeout(() => {
      // uzenetek lekerese
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
          // felhasznaloi adatok lekerese
          this.base.getUserProfiles().subscribe((userProfiles: any[]) => {
            this.userProfiles = userProfiles;
            this.userProfile = userProfiles.filter(
              (userProfile: any) => userProfile.uid === user.uid
            );

            this.user.userId = this.userProfile[0].uid;
            this.userProfile[0]['key'] = this.userProfile[0]['key'];

            this.user.displayName = this.userProfile[0].displayName!;
            this.user.email = this.userProfile[0].email!;

            this.refFriends = this.realTimeDatabase.list(
              `/users/${this.userProfile[0]['key']}/friends`
            );

            // baratok listajanak lekerese
            this.refFriends
              .snapshotChanges()
              .pipe(
                map((changes) =>
                  changes.map((c) => ({
                    key: c.payload.key,
                    ...c.payload.val(),
                  }))
                )
              )
              .subscribe((val: any[]) => {
                this.friendsOn = true;
                this.userProfile[0].friends = val;

                //  baratok tomb
                let friends: any[] = this.userProfile[0].friends.map(
                  (friend) => friend[0].uid
                );
                this.userFriends = friends;

                //  nem baratok tomb
                let userProf: any[] = this.userProfiles
                  .map((uP) => uP)
                  .filter((item) => !friends.includes(item.uid));
                this.userNotFriends = userProf;
              });
          });
        }
      );
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
      let friendM = messages.filter(
        (message) =>
          message.uid === this.selectedFriend[0][0].uid ||
          message.uid === this.userProfile[0].uid
      );
      this.friendMessages = friendM;
    });
  }

  clearInput() {
    this.message.message = '';
  }

  deleteMessage(message: Chat) {
    this.base.deleteMessage(message).then((res) =>
      this.base.getMessages().subscribe((messages: any[]) => {
        let friendM = messages.filter(
          (message) =>
            message.uid === this.selectedFriend[0][0].uid ||
            message.uid === this.userProfile[0].uid
        );
        this.friendMessages = friendM;
      })
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
    this.base.getMessages().subscribe((messages: any[]) => {
      let friendM = messages.filter(
        (message) =>
          message.uid === this.selectedFriend[0][0].uid ||
          message.uid === this.userProfile[0].uid
      );

      this.friendMessages = friendM;
    });
    this.viewPortScroller.scrollToAnchor(this.updateMessageKey);
    this.editMessage = false;
  }

  backToUsers() {
    this.sendPrivateMessageOn = false;
    this.friendMessages = [];
  }

  signAsFirstFriend(user: UserClass) {
    if (this.userProfile[0].friends.length === 0) {
      let friends = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        profilePhoto: user.profilePicture
      };
      let friendss: UserClass[] = [];
      friendss.push(friends as unknown as UserClass);
      this.addFriends(friendss as unknown as UserClass[]);
    } else {
      this.signAsAFriend(user);
    }
  }

  signAsAFriend(user: UserClass) {
    let friends = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      profilePhoto: user.profilePicture
    };
    let friendss:UserClass[] = [];
    friendss.push(friends as unknown as UserClass);
    let friend = this.userProfile[0].friends.filter(
      (friend) => friend[0].uid == user.uid
    );
    for (let key in friend[0]) {
      this.signedFriend = {
        uid: friend[0][0].uid,
        email: friend[0][0].email,
        displayName: friend[0][0].displayName,
      };
    }

    if (friend.length === 0) {
      this.addFriends(friendss as unknown as UserClass[]);
    } else return;
    //  this.base.updateUserData(this.userProfile[0].friends, this.userProfile[0]["key"] as string)
  }

   getMessageUser(user: UserClass) {
    let friend = this.userProfile[0].friends.filter(
      (friend) => friend[0].uid == user.uid
    );
    this.selectedFriend = friend;
    let fMessage: any[] = [];
    if (this.selectedFriend.length !== 0) {
      fMessage = this.messages.filter(
        (message) =>
          message.uid === this.selectedFriend[0][0].uid ||
          message.uid === this.userProfile[0].uid
      );
      console.log(fMessage);
    }
    this.friendMessages = fMessage;
    this.sendPrivateMessageOn = true;
  }

  openDialog() {
    const dialogRef = this.dialog.open(MessageModalComponent,{
      data: this.getMessageUser,
    }
      );

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
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


@Component({
  selector: 'app-message-modal',
  template: `
              
`,
  standalone: false,
  styleUrls: ['./chat.component.scss']
})
export class MessageModalComponent{


  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

}