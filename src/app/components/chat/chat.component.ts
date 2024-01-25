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
import { Subject, Subscription, map } from 'rxjs';
import { Chat } from 'src/app/models/chat.model';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { MatAccordion } from '@angular/material/expansion';
import {
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';

type Friend = {
  friendId: string;
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
  message: Chat = new Chat()
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

  // keysSubject: Subject<any> = new Subject()
  teszt: any;

  userNotFriends: any[] = [];
  userFriends: any[] = [];

  signedFriend: Friend = {
    friendId: '',
  };

  keys: {
    userKey: string;
    friendKey: string;
    messageKey: string;
  } = {
    userKey: '',
    friendKey: '',
    messageKey: '',
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

  addFriends(data: UserClass) {
    this.refFriends.push(data);
  }

  removeFriend(data: {key: string}) {
    this.refFriends.remove(data.key)
  }

  // addMessageToDatabase(body: Chat) {
  //   this.refChats.push(body)
  // }

  ngOnInit() {
    setTimeout(() => {
      // uzenetek lekerese
      this.base.getMessages()!.subscribe((messages: any[]) => {
        if (0 === 0) {  //this.messages.length
          for (let message of messages) {
            if (message.uid === this.user.userId) {
              this.user.messageId = message.uid;
            }
            message.id = message['key'];
            message.id = message.uid;
            

            this.messages = messages;
            console.log(this.messages)
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
                  (f) => f.friendId
                );
                this.userFriends = friends;

                //  nem baratok tomb
                let userProf: any[] = this.userProfiles
                  .map((uP) => uP)
                  .filter((item) => !friends.includes(item.uid));
                this.userNotFriends = userProf;
              });

            this.realTimeDatabase
              .list(`users/${this.userProfile[0]['key']}/friends/-Nov51cNwRd1Qys4K887/message/`)
              .snapshotChanges()
              .pipe(
                map((changes) =>
                  changes.map((c) => ({
                    key: c.payload.key,
                    ...c.payload.val()!,
                  }))
                )
              )
              .subscribe((val: any) => {
                // this.friendsOn = true;
                console.log(val);
              });
              console.log(this.userProfile[0])
          });
        }
      );
    }, 2000);
    this.isSuperAdminSubscription = this.auth.isSuperAdmin.subscribe(
      (value) => (this.isSAdmin = value)
    );
  }

  getUserById(userKey: string) {
    const documentRef = this.realTimeDatabase.database.ref(`users/${userKey}`);
    documentRef.once('value').then((snapshot) => {
      const documentData = snapshot.val();
      console.log(documentData);
    });
  }

  getFriendById(userKey: string, friendKey: string) {
    const documentRef = this.realTimeDatabase.database.ref(
      `users/${userKey}/friends/${friendKey}`
    );
    documentRef.once('value').then((snapshot) => {
      const documentData = snapshot.val();
      console.log(documentData);
    });
  }

  getMessageById(userKey: string, friendKey: string, messageKey?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const documentRef = this.realTimeDatabase.object(`users/${userKey}/friends/${friendKey}/message/${messageKey}`);
  
      documentRef.valueChanges().subscribe(
        (adat: any) => {
          if (adat) {
            resolve(adat);
          } else {
            reject('Az üzenet nem található.');
          }
        },
        (error) => {
          reject(`Hiba a lekérdezés során: ${error}`);
        }
      );
    }).then(
      (res) => console.log(res)
    )
  }

  addMessage2(userKey: string, friendKey: string) {
    const keys = {
      userKey,
      friendKey,
    };
    this.keys.userKey = keys.userKey;
    this.keys.friendKey = keys.friendKey;
    const refDat = this.realTimeDatabase.list(
      `/users/${this.userProfile[0].key}/friends/${this.keys.friendKey}/message`
    );
    const newKeyRef = refDat.push(this.message);
    const newKey = newKeyRef.key
    newKeyRef.update({key: newKey})
    console.log(newKey)


  }

  addMessage() {
    this.base.keysSubject.next({userKey: this.userProfile[0].key, friendKey: this.selectedFriend[0].key})
      this.message.senderId = this.userProfile[0].uid;
      this.message.receiverId = this.selectedFriend[0].friendId
    let date = new Date();
    let dateString =
      date.toLocaleDateString() + '  ' + date.toLocaleTimeString();
    this.message.timeStamp = dateString;

    this.base.addMessage(this.message);
    this.base.getMessages()!.subscribe((messages: any[]) => {
      let friendM = messages.filter(
        (message: Chat) =>
          message.receiverId === this.selectedFriend[0].friendId &&
          message.senderId === this.userProfile[0].uid
      );
      this.friendMessages = friendM;
    });
  }

  getMessageUser(user: UserClass, message: any) {
    // let m = this.userProfiles.filter(
    //   (u) => {if(u.friends.length !==0){u.friends.filter(
        
    //     (f)=> {if(f.messages) {f.messages.filter(
    //       (m) => m.senderId === f.friendId
    //     )}}
    //   )}}
    // )
    let friends: any
    let tomb2: any[] = []
    this.userProfiles.forEach(
      (u) => {u
      console.log(u.friends)
        tomb2.push(u)
    }
    )
     
    // for(let ert of friends) {
    //   tomb2.push(...ert)
      
    // }
    console.log(tomb2)

    let friend = this.userProfile[0].friends.filter(
      (f) => f.friendId == user.uid
    );
    this.selectedFriend = friend;
    let fMessage: any[] = [];
    if (this.selectedFriend.length !== 0) {
      fMessage = this.messages.filter(
        (message) =>{
          
        
          return message.senderId === this.userProfile[0].uid  ||
          message.receiverId === this.selectedFriend[0].friendId 
          //message.senderId === this.selectedFriend[0].friendId
          
        }
      );
      this.base.keysSubject.next({userKey: this.userProfile[0].key, friendKey: this.selectedFriend[0].key})
      
      console.log(message);
      console.log(this.selectedFriend[0].friendId)
      console.log(this.selectedFriend[0].messages)
    }
    
    //  this.friendMessages = fMessage;
    if(this.selectedFriend[0].messages){
    let object = Object.entries(this.selectedFriend[0].messages)
    let tomb:any[] = []
    for(let ert of object) {
      tomb.push(...ert)
      
    }
    console.log(tomb)
    this.friendMessages = tomb
  }
    console.log(this.friendMessages)
    this.sendPrivateMessageOn = true;
  }

  clearInput() {
    this.message.message = '';
  }

  deleteMessage(message: Chat) {
    this.base.deleteMessage(message).then((res) =>
      this.base.getMessages()!.subscribe((messages: any[]) => {
        let friendM = messages.filter(
          (message) =>
            message.uid === this.selectedFriend[0].uid ||
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

      this.message.senderId = this.userProfile[0].uid;
      this.message.receiverId = this.selectedFriend[0].uid
    let date = new Date();
    let dateString =
      date.toLocaleDateString() + '  ' + date.toLocaleTimeString();
    this.message.timeStamp = dateString;
    this.base.updateMessage(this.updateMessageKey, this.message);
    this.base.getMessages()!.subscribe((messages: any[]) => {
      let friendM = messages.filter(
        (message: Chat) =>
          message.receiverId === this.selectedFriend[0].uid ||
          message.senderId === this.userProfile[0].uid
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
        friendId: user.uid,
        displayName: user.displayName,
        email: user.email,
        profilePhoto: user.profilePicture,
      };
      let friendss: UserClass[] = [];
      friendss.push(friends as unknown as UserClass);
      this.addFriends(friends as unknown as UserClass);
    } else {
      this.signAsAFriend(user);
    }
  }

  signAsAFriend(user: UserClass) {
    let friends = {
      friendId: user.uid,
      displayName: user.displayName,
      email: user.email,
      profilePhoto: user.profilePicture,
    };
    let friendss: UserClass[] = [];
    friendss.push(friends as unknown as UserClass);
    let friend = this.userProfile[0].friends.filter(
      (f) => f.friendId == user.uid
    );
    for (let key in friend[0]) {
      this.signedFriend = {
        friendId: friend[0].friendId,
      };
    }

    if (friend.length === 0) {
      this.addFriends(friends as unknown as UserClass);
    } else return;
    //  this.base.updateUserData(this.userProfile[0].friends, this.userProfile[0]["key"] as string)
  }



  getMessageByKey() {
    let messageKey: any[] = []
    for(let message of this.messages){
      messageKey.push(message['key'])
    }
   const refChats = this.realTimeDatabase.database.ref(`chats/${messageKey[0]}}`)
   refChats.once("value").then(
    (adat:any) => {this.friendMessages.push(adat.val()) 
      console.log(this.friendMessages)
      this.sendPrivateMessageOn = true;
    }
   )
   console.log(messageKey)
  }

  openDialog() {
    const dialogRef = this.dialog.open(MessageModalComponent, {
      data: this.getMessageUser,
    });

    dialogRef.afterClosed().subscribe((result) => {
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
  template: ``,
  standalone: false,
  styleUrls: ['./chat.component.scss'],
})
export class MessageModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
