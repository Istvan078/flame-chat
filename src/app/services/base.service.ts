import { Injectable } from '@angular/core';

import {
  AngularFireDatabase,
  AngularFireList,
} from '@angular/fire/compat/database';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  catchError,
  finalize,
  map,
  of,
  throwError,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Chat } from '../models/chat.model';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Friends, UserClass } from '../models/user.model';
import firebase from 'firebase/compat/app';
import emailjs from '@emailjs/browser';
import { Environments } from '../environments';

interface Friend {
  key: string;
  friendId: string;
  seenMe: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  profilePicUrlSubject: Subject<string> = new Subject();
  picturesSubject: Subject<string[]> = new Subject();
  refChats!: AngularFireList<Chat>;
  refUsers: AngularFireList<UserClass>;
  refUser!: AngularFireList<UserClass>;
  // refFriends!: AngularFireList<UserClass>;
  apiUrl = 'https://us-central1-project0781.cloudfunctions.net/api/';
  userProfileSubject: BehaviorSubject<any> = new BehaviorSubject({});
  userProfilesSubject: BehaviorSubject<UserClass[]> = new BehaviorSubject<
    UserClass[]
  >([]);
  friendProfileSubject: BehaviorSubject<any> = new BehaviorSubject({});

  basePath: any = '/pictures';
  dbRef: AngularFireList<any>;

  profileSeenSubject: BehaviorSubject<any> = new BehaviorSubject([]);
  selectedFriendSubject: BehaviorSubject<any> = new BehaviorSubject({});
  logicalSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  getAllMessagesSubject: BehaviorSubject<any> = new BehaviorSubject({});
  newMessageNotiSubject: BehaviorSubject<any> = new BehaviorSubject([]);
  haventSeenMsgsArr: BehaviorSubject<any> = new BehaviorSubject([]);

  userKeySubject: BehaviorSubject<any> = new BehaviorSubject('');
  userKeySubjectSubscription!: Subscription;

  userKey: any;

  constructor(
    private realTimeDatabase: AngularFireDatabase,
    private fireStorage: AngularFireStorage,
    private http: HttpClient
  ) {
    this.refChats = realTimeDatabase.list(`/chats`);
    this.refUsers = realTimeDatabase.list('/users');
    this.dbRef = realTimeDatabase.list(this.basePath);
  }

  getUserProfiles(): Observable<any> {
    return this.refUsers.snapshotChanges().pipe(
      map(changes =>
        changes.map(c => ({ key: c.payload.key, ...c.payload.val() }))
      ),
      catchError((err, caught) => {
        throw err;
      })
    );
  }

  removeUserProfile(userKey: string) {
    this.refUsers.remove(userKey);
  }

  addFriends(friend: any, friendKey: string, userKey: string) {
    // this.realTimeDatabase
    // .object(`users/${userKey}/friends/${friendKey}`)
    // .update(friend);
    return this.realTimeDatabase
      .object(`users/${userKey}/friends/${friendKey}`)
      .update(friend);
  }

  // getFriendsForReset(userKey: string): Observable<any[]> {
  //   return this.realTimeDatabase
  //     .list(`users/${userKey}/friends`)
  //     .snapshotChanges()
  //     .pipe(
  //       map(changes =>
  //         changes.map((c: any) => ({ key: c.payload.key, ...c.payload.val() }))
  //       )
  //     );
  // }

  // removeFriendsForReset(userKey: string, friendKey: string) {
  //   return this.realTimeDatabase
  //     .object(`users/${userKey}/friends/${friendKey}`)
  //     .remove();
  // }

  // resetFriends(userKey: string, friendKey: string, friend: any) {
  //   return this.realTimeDatabase
  //     .object(`users/${userKey}/friends/${friendKey}`)
  //     .update(friend);
  // }

  updateFriend(friendKey: string, body: UserClass, userKey: string) {
    const refFriends = this.realTimeDatabase.list(`users/${userKey}/friends`);
    return firebase
      .database()
      .ref(`users/${userKey}/friends`)
      .once('value')
      .then(val => {
        return refFriends.update(friendKey, body);
      });
  }

  updateFriendsFriend(friendKey: string, userProfKey: string, data: any) {
    // const ref = firebase.database().ref(`users/${this.userKey}/friends`)
    // return ref
    // .once('value')
    // .then(val => {
    //   return ref.update(friendKey, body);
    // });
    const ref = this.realTimeDatabase.list(`users/${friendKey}/friends`);
    return ref.update(userProfKey, data);
  }

  removeFriend(friendKey: string, userKey: string) {
    const refFriends = this.realTimeDatabase.list(`users/${userKey}/friends`);
    return refFriends.remove(friendKey);
  }

  removeFriendsFriend(friendKey: string, userProfKey: string) {
    const ref = this.realTimeDatabase.list(`users/${friendKey}/friends`);
    return ref.remove(userProfKey);
  }

  getUserMessagesRefactored(userUid: string, friendUid: string) {
    if (friendUid) {
      const promise1 = new Promise((res, rej) => {
        const ref2 = this.realTimeDatabase.list('chats', ref2 => {
          const oneHourAgo = new Date();
          oneHourAgo.setMonth(oneHourAgo.getMonth() - 3);
          return ref2
            .orderByChild('participants/2')
            .startAt(
              ((friendUid + userUid) as string) + '-' + oneHourAgo.getTime()
            )
            .endAt(
              ((friendUid + userUid) as string) + '-' + new Date().getTime()
            )
            .limitToLast(10);
        });
        ref2.valueChanges(['child_added']).subscribe(val => {
          return res(val);
        });
      });

      const promise2 = new Promise((res, rej) => {
        const ref3 = this.realTimeDatabase.list('chats', ref3 =>
          ref3.orderByChild('message/senderId').equalTo(userUid as string)
        );
        ref3.valueChanges(['child_added']).subscribe(val => {
          res(val);
        });
      });
      const myAllMessagesArr = [promise1, promise2];
      const frAndMyMessages = Promise.all(myAllMessagesArr).then(res => {
        return res.flat();
      });
      return frAndMyMessages;
    }
  }

  getNewMessages() {
    const ref = this.realTimeDatabase.list('chats', ref2 =>
      ref2.orderByChild('message/timeStamp').limitToLast(10)
    );
    return ref
      .snapshotChanges(['child_added'])
      .pipe(
        map(ch =>
          ch.map((c: any) => ({ key: c.payload.key, ...c.payload.val() }))
        )
      );
  }

  getFriends(userProfKey: string): Observable<Friends[]> {
    const refFriends = this.realTimeDatabase.list(
      `users/${userProfKey}/friends`
    );
    if (userProfKey) {
      return <Observable<Friends[]>>(
        refFriends
          .snapshotChanges(['child_changed', 'child_removed', 'child_added'])
          .pipe(
            map(changes =>
              changes.map(
                (c: any) =>
                  <Friends>{
                    key: c.payload.key,
                    ...c.payload.val(),
                  }
              )
            ),
            catchError(errorRes => {
              return throwError(errorRes);
            })
          )
      );
    }
    const emptyArrObs: Observable<Friends[]> = of([]);
    return emptyArrObs;
  }

  addUserData(body: any) {
    return this.refUsers.push(body);
  }

  addUserPictures(userKey: any, body: any) {
    this.refUser = this.realTimeDatabase.list(`users/`);
    this.refUser.update(userKey, body);
  }

  // tanarral
  addFileData(user: any, fname: any, fsUrl: any) {
    const data = { name: fname, url: fsUrl };
    this.dbRef = this.realTimeDatabase.list(
      `users/${user.key}/${this.basePath}`
    );
    this.dbRef.push(data);
  }

  getData(user: any) {
    this.dbRef = this.realTimeDatabase.list(
      `users/${user['key']}${this.basePath}`
    );
    return this.dbRef;
  }

  deleteUserPicture(user: any, file: any) {
    this.refUser = this.realTimeDatabase.list(`users/${user['key']}/pictures`);
    this.refUser.remove(file.key).then(() => {
      const picturePath = `${this.basePath}/${user.displayName}/${file.name}`;
      const storegeRef = this.fireStorage.ref(picturePath);
      storegeRef.delete().subscribe(() => console.log('Kép sikeres törlése'));
    });
  }

  updateUserData(body: any, key: string) {
    if (key) return this.refUsers.update(key, body);
  }

  deleteUserData(id: string) {
    return this.refUsers.remove(id);
  }

  getProfilePictures(userEmail: string) {
    const fullPath = 'profilePictures/' + userEmail;
    const storageRef = this.fireStorage.ref(fullPath);
    const urls: any[] = [];
    return new Promise(res => {
      storageRef.listAll().subscribe(what => {
        what.items.forEach(item =>
          item
            .getDownloadURL()
            .then(url => urls.push(url))
            .then(resolve => res(urls))
        );
      });
    });
  }

  addProfilePicture(file: any, userEmail: string) {
    const fullPath = 'profilePictures/' + userEmail + '/' + file.name;
    const storageRef = this.fireStorage.ref(fullPath);
    const upload = this.fireStorage.upload(fullPath, file);
    upload
      .snapshotChanges()
      .pipe(
        finalize(() => {
          return storageRef.getDownloadURL().subscribe((url: string) => {
            this.profilePicUrlSubject.next(url);
          });
        })
      )
      .subscribe();
    return upload.percentageChanges();
  }

  addPictures(user: any, file: any) {
    const fullPath = `${this.basePath}/${user.displayName}/${file.name}`;
    const storageRef = this.fireStorage.ref(fullPath);
    const upload = this.fireStorage.upload(fullPath, file);
    upload
      .snapshotChanges()
      .pipe(
        finalize(() => {
          return storageRef.getDownloadURL().subscribe((url: any) => {
            this.addFileData(user, file.name, url);
          });
        })
      )
      .subscribe();
    return upload.percentageChanges();
  }

  addMessage(body: Chat) {
    this.refChats.push(body);
  }

  updateMessage(key: any, body: Partial<Chat>) {
    return this.refChats.update(key, body);
  }

  deleteMessage(body: any) {
    return this.refChats.remove(body['key']);
  }

  deleteMessages() {
    this.refChats.remove();
  }

  getMessages() {
    return this.refChats
      .snapshotChanges()
      .pipe(
        map(changes =>
          changes.map(c => ({ key: c.payload.key, ...c.payload.val() }))
        )
      );
  }
  async sendEmail(templateId: string, templateParams: {}) {
    const res = await emailjs.send(
      Environments.EMAILJS_SERVICE_ID,
      templateId,
      templateParams,
      {
        publicKey: 'fEZkI9mcDSDrrWEze',
      }
    );
    return res;
  }
  async sendWelcomeEmail(email: string) {
    let templateParams = {
      fromEmail: 'noreply@flame-chat.hu',
      replyTo: 'kalmaristvan078@gmail.com',
      toEmail: email,
      messageDate: new Date().toLocaleString(),
    };
    const res = await this.sendEmail(
      Environments.EMAILJS_WELCOME_TEMPLATE_ID,
      templateParams
    );
    console.log(res, 'E-mail sikeresen elküldve');
  }

  async sendMessNotificationEmail(
    friend: Friends,
    message: Chat,
    user: UserClass
  ) {
    let templateParams = {
      username: friend.displayName,
      message: message.message.message,
      fromUserProfPic: user.profilePicture,
      fromName: user.displayName,
      appName: 'Flame Chat',
      toEmail: friend.email,
      timeStamp: new Date().toLocaleString(),
    };
    const res = await this.sendEmail(
      Environments.EMAILJS_MESSAGED_ME_TEMPLATE_ID,
      templateParams
    );
    console.log(res, 'E-mail sikeresen elküldve');
  }
}
