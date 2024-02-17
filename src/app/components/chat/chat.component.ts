import { ViewportScroller } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  AngularFireDatabase,
  AngularFireList,
} from '@angular/fire/compat/database';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription, map } from 'rxjs';
import { Chat } from 'src/app/models/chat.model';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { MatAccordion } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modals/modal/modal.component';

type Friend = {
  friendId: string;
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild(MatAccordion) accordion!: MatAccordion;
  @ViewChild('toastHeader') toastHeader!: ElementRef;

  toastVal: any = {};

  users: Chat[] = [];
  signAsFriend: UserClass = new UserClass();
  isSAdmin: boolean = false;
  message: Chat = new Chat();
  updateUserMessage: Chat = new Chat();
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

  friendsUserProfArr: any[] = [];
  removedFriend: boolean = false;

  allChatsArray: any[] = [];
  userMessages: boolean = false;
  haventSeenMessagesArr: any[] = [];
  messFromSelFriendArr: any[] = [];
  newMessagesArr: any[] = [];

  userNotFriends: any[] = [];
  userFriends: any[] = [];

  signedFriend: Friend = {
    friendId: '',
  };

  selectedFriend: any = {};

  userLoggedInSubscription!: Subscription;
  isSuperAdminSubscription!: Subscription;
  usersSubscription!: Subscription;

  constructor(
    private realTimeDatabase: AngularFireDatabase,
    private auth: AuthService,
    private base: BaseService,
    private viewPortScroller: ViewportScroller,
    private router: Router,
    private _snackbar: MatSnackBar,
    private ngbModal: NgbModal
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
  }

  ngOnInit() {
    // setTimeout(() => {
      this.userLoggedInSubscription = this.auth
        .getUserLoggedInSubject()
        .subscribe((user: any) => {
          // felhasznaloi adatok lekerese
          this.base.getUserProfiles().subscribe((userProfiles: any[]) => {
            this.userProfiles = userProfiles;
            this.userProfile = userProfiles.filter(
              (userProfile: any) => userProfile.uid === user.uid
            );

            this.userProfile[0].key = this.userProfile[0]['key']
            // userKey átadása base service-nek
            this.base.userKeySubject.next(this.userProfile[0]['key']);
            // baratok listajanak lekerese
            this.base.getFriends().subscribe((val: any[]) => {
              this.friendsOn = true;
              this.userProfile[0].friends = val;

              //  baratok tomb
              let friendsUids: any[] = [];
              let friendsTomb: any[] = [];

              this.userProfiles.map((up) => {
                return this.userProfile[0].friends?.map((f) => {
                  let prof = this.userProfiles.find(
                    (uP) => f.friendId === uP.uid
                  );
                  console.log(prof);
                  friendsUids.push(f.friendId);
                  if (up.uid === f.friendId) {
                    return friendsTomb.push({
                      friendKey: f['key'],
                      friendId: f.friendId,
                      displayName: prof?.displayName,
                      profilePicture: prof?.profilePicture,
                      email: prof?.email,
                    });
                  }
                });
              });

              this.userFriends = friendsTomb;
              console.log(this.userFriends);
              //  nem baratok tomb
              let userProf: any[] = this.userProfiles
                .map((uP) => uP)
                .filter(
                  (item) =>
                    !friendsUids.includes(item.uid) &&
                    item.uid !== this.userProfile[0].uid
                );
              this.userNotFriends = userProf;
              console.log(this.userNotFriends);
            });

            // chatek lekérése
            this.getMessages().subscribe((val) => {
              console.log(val);
              this.allChatsArray = val;
              this.haventSeenMessagesArr = this.allChatsArray.filter(
                (item) =>
                  item.message.seen === false &&
                  this.userProfile[0].uid === item.participants[1]
              );
              let [tomb] = this.haventSeenMessagesArr.map((item) => {
                return this.userProfile[0].friends!.filter(
                  (friend) => friend.friendId === item.message.senderId
                );
              });
              this.newMessagesArr = tomb;
              if (!this.newMessagesArr) {
                this.newMessagesArr = [1];
                console.log(this.newMessagesArr);
              }
            });
          });
        });

      this.isSuperAdminSubscription = this.auth.isSuperAdmin.subscribe(
        (value) => (this.isSAdmin = value)
      );
    // }, 2000);
  }

  randomIdGenerator() {
    const idString = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let chatId = 'chat_id_';
    let friendId = 'friend_id_';
    for (let i = 0; i <= 7; i++) {
      if (this.message.message.message) {
        chatId += idString.charAt(Math.round(Math.random() * 30));
      } else {
        friendId += idString.charAt(Math.round(Math.random() * 30));
      }
    }
    if (this.message.message.message) return chatId;
    else return friendId;
  }

  toUserProfile() {
    this.router.navigate([`profile/${this.userProfile[0].uid}`]);
  }

  addMessage() {
    let date = new Date();
    let dateString =
      date.toLocaleDateString() + '  ' + date.toLocaleTimeString();

    this.message.message.senderId = this.userProfile[0].uid;
    this.message.message.timeStamp = dateString;
    this.message.participants[0] = this.userProfile[0].uid;
    this.message.participants[1] = this.selectedFriend.friendId;
    this.message.message.displayName = this.userProfile[0].displayName;
    this.message.message.email = this.userProfile[0].email as string;
    this.message.message.profilePhoto = this.userProfile[0].profilePicture;

    this.base.updateMessage(this.randomIdGenerator(), this.message);
  }

  getMessageUser(user: any) {
    // let friend = this.userProfile[0].friends!.filter(
    //   (f) => f.friendId == user.uid
    // );
    this.selectedFriend = user; // objektum
    console.log(this.selectedFriend)
    this.sendPrivateMessageOn = true;
    this.userMessages = true;
    let messFromSelFriendArr = this.allChatsArray.filter(
      (item) =>
        this.selectedFriend.friendId === item.message.senderId &&
        this.userProfile[0].uid === item.participants[1]
    );
    messFromSelFriendArr.forEach((mess) => {
      if (mess.message.seen === false) {
        mess.message.seen = true;
        this.base.updateMessage(mess.key, mess);
      }
    });
  }

  clearInput() {
    this.message.message.message = '';
  }

  deleteMessage(message: Chat) {
    this.base.deleteMessage(message);
  }

  getMessages() {
    return this.base.refChats
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes.map((c) => ({ key: c.payload.key, ...c.payload.val() }))
        )
      );
  }

  deleteMessages() {
    this.base.deleteMessages();
  }

  navigateToUpdateMessage(message: Chat) {
    this.updateUserMessage = message;
    console.log(this.updateUserMessage);
    this.updateMessageKey = message['key'] as string;
    console.log(this.updateMessageKey);
    this.editMessage = true;
    this.message.message.message = message.message.message;
    this.viewPortScroller.scrollToPosition([0, 0]);
  }

  updateMessage() {
    let date = new Date();
    let dateString =
      date.toLocaleDateString() + '  ' + date.toLocaleTimeString();
    this.updateUserMessage.message.timeStamp = dateString;
    this.updateUserMessage.message.message = this.message.message.message;
    this.base.updateMessage(this.updateMessageKey, this.updateUserMessage);
    this.viewPortScroller.scrollToAnchor(this.updateMessageKey);
    this.editMessage = false;
  }

  backToUsers() {
    this.sendPrivateMessageOn = false;
    this.userMessages = false;
  }

  signAsAFriend(user: UserClass) {
    let friend = {
      friendId: user.uid,
    };
    this.base.addFriends(friend as unknown as UserClass).then(() => {
      const modalRef = this.ngbModal.open(ModalComponent,{
        centered:true
      });
      modalRef.componentInstance.friendName = user.displayName;
      this.toastVal = user;
      console.log(this.toastVal);
      modalRef.componentInstance.name = 'Ismerősnek jelölve.';
    });
  }

  removeFriend(friend: any) {
    this.base.removeFriend(friend).then(() => {
      const modalRef = this.ngbModal.open(ModalComponent, {
        ariaLabelledBy: 'modal-basic-title',
        centered: true
      });
      modalRef.componentInstance.name = 'Törölve az ismerősök közül.';
      console.log(this.toastHeader);
      if (this.toastVal.uid == friend.friendId) {
        modalRef.componentInstance.friendName = this.toastVal.displayName;
      }
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
