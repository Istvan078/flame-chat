import { ViewportScroller } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/compat/database';
import { Router } from '@angular/router';
import { ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { Subscription, map } from 'rxjs';
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
  signAsFriend: UserClass = new UserClass();
  isSAdmin: boolean = false;
  message: Chat = new Chat();
  messages: Chat[] = [];
  editMessage: boolean = false;
  updateMessageKey: string = '';
  userObject!: UserClass;
  userProfiles: UserClass[] = [];
  userProfile: UserClass[] = [];
  count: number = 0;
  searchWord: string = ""
  refFriends!: AngularFireList<UserClass>;

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
    private realTimeDatabase: AngularFireDatabase,
    private auth: AuthService,
    private base: BaseService,
    private viewPortScroller: ViewportScroller,
    private router: Router
  ) {

  }

  addFriends(data: any) {
    this.refFriends.push(data)
  }

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
            this.userProfile[0]['key'] = this.userProfile[0]['key'];
            this.refFriends = this.realTimeDatabase.list(`/users/${this.userProfile[0]['key']}/friends`);
            
            this.user.displayName = this.userProfile[0].displayName!;
            this.user.email = this.userProfile[0].email!;
            
            for(let friend in this.userProfile[0].friends) {
              this.userProfile[0]["friendss"] = friend
              for(let s in friend) {}
              console.log(this.userProfile[0]["friendss"])
            }
          });
        }
      );

    //   this.refFriends.snapshotChanges().pipe(
    //     map((changes) => changes.map(
    //       (c) => ({key:c.payload.key, ...c.payload.val()})
    //     ))
    //  ).subscribe(
    //    (friends) => console.log(friends)
    //   )
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

  signAsAFriend(user: UserClass) {
    
    let friends = {
      uid: user.uid,
      displayName: user.displayName,
      
      email: user.email
    }
    //  this.userProfile[0].friends = []
    // this.userProfile[0].friends.push(friends)

     this.addFriends(friends)
    
    // this.userProfile[0]['key']
    //  this.signAsFriend.friends = 
    //  this.base.updateUserData(this.userProfile[0].friends, this.userProfile[0]["key"] as string)
    
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
