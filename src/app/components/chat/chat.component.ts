import { ViewportScroller } from '@angular/common';
import {
  Component,
  ElementRef,
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

  userFriends: {
    friendId?: string | undefined;
    // userId?: string | undefined;
    // notSigned?: boolean; 
   }[] = [];
  userProfilesUid: { uid: string }[] = [];
  userFriendsSubject: Subject<any> = new Subject()

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

  addFriends(data: any) {
    this.refFriends.push(data);
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
                // this.userProfile[0].friends.forEach(
                //   (elem) => {
                //     if(elem[0].uid){
                //       this.userFriendsSubject.next(true)
                //     }
                  
                //   }
                // )

                                this.userProfiles.map(
                  (value, ind) =>{ 
                      this.userProfile[0].friends.map(
                      (val, i) =>{ 
                        if(value.uid === val[0].uid){
                           
                        var obj4: {
                          friendId: string,
                        } = {friendId: val[0].uid }
                       this.userFriends.push(obj4)}})})


                // this.userProfiles.map(
                //   (value, ind) =>{ 
                //       this.userProfile[0].friends.map(
                //       (val, i) =>{ 
                //         if(value.uid === val[0].uid){
                //            this.userFriends.length = ind
                //         var obj4: {
                //           friendId: string,
                //         } = {friendId: val[0].uid + "drt"}
                //        this.userFriends.push(obj4)

                //       }  if(this.userFriends.length < this.userProfiles.length) {
                //          this.userFriends.length = ind
                //         let obj4: {
                //           friendId: string,
                //         } = {friendId: value.uid}
                //        this.userFriends.push(obj4)
                //       }
                //     } 
                //     )})
                    
                  
                
                console.log(this.userFriends)
               
                // this.userProfile[0].friends.forEach(
                //   (value1,ind) => {
                //   //  this.userFriends.push({friendId: value[0].uid, userId: undefined})
                

                // this.userProfiles.forEach(
                //   (value2, i) => {
                //     if(value1[0].uid == value2.uid){
                //     var obj3: {
                //       friendId: string,
                //       userId: string
                //     } = {friendId: value1[0].uid,
                //     userId: value2.uid}
                //    this.userFriends.push(obj3)
                //   } else{

                //   }
                    
                //   }
                //   //  {this.userFriends.push({userId: value.uid, friendId: undefined}
                //   ) })
                  
                  
                  
                  // console.log(this.userFriends)
                
                
                

              });
              // this.userFriendsSubject.subscribe(
              //   (boolean) => this.isFriend = boolean
              // )
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
      };
      let friendss = [];
      friendss.push(friends);
      this.addFriends(friendss);
    } else {
      this.signAsAFriend(user);
    }
  }

  signAsAFriend(user: UserClass) {
    let friends = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
    };
    let friendss = [];
    friendss.push(friends);
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
      this.addFriends(friendss);
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
