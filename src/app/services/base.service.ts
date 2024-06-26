import { Injectable, OnDestroy } from '@angular/core';

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
import { UserClass } from '../models/user.model';
import firebase from 'firebase/compat/app';

interface Friend {
  key: string;
  friendId: string;
  seenMe: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BaseService implements OnDestroy {
  profilePicUrlSubject: Subject<string> = new Subject();
  picturesSubject: Subject<string[]> = new Subject();
  refChats!: AngularFireList<Chat>;
  refUsers: AngularFireList<UserClass>;
  refUser!: AngularFireList<UserClass>;
  refFriends!: AngularFireList<UserClass>;
  apiUrl = 'https://us-central1-project0781.cloudfunctions.net/api/';
  userProfileSubject: BehaviorSubject<any> = new BehaviorSubject({});
  userProfilesSubject: BehaviorSubject<UserClass[]> = new BehaviorSubject<
    UserClass[]
  >([]);
  friendProfileSubject: BehaviorSubject<any> = new BehaviorSubject({});

  basePath: any = '/pictures';
  dbRef: AngularFireList<any>;

  profileSeenSubject: BehaviorSubject<any> = new BehaviorSubject([]);
  userFriendsSubject: BehaviorSubject<any> = new BehaviorSubject({});
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

    this.userKeySubjectSubscription = this.userKeySubject.subscribe(
      (userKey: any) => {
        this.userKey = userKey;
        this.refFriends = this.realTimeDatabase.list(
          `/users/${userKey}/friends`
        );
      }
    );
  }

  ngOnDestroy(): void {
    this.userKeySubjectSubscription.unsubscribe();
  }

  getUserProfiles(): Observable<any> {
    return this.refUsers
      .snapshotChanges()
      .pipe(
        map(changes =>
          changes.map(c => ({ key: c.payload.key, ...c.payload.val() }))
        )
      );
  }

  removeUserProfile(userKey: string) {
    this.refUsers.remove(userKey);
  }

  // id: string,
  addFriends(friend: any) {
    return this.refFriends.push(friend);
  }

  updateFriend(friendKey: string, body: UserClass) {
    return firebase
      .database()
      .ref(`users/${this.userKey}/friends`)
      .once('value')
      .then(val => {
        return this.refFriends.update(friendKey, body);
      });
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

  removeFriend(id: string) {
    // this.refFriends = this.realTimeDatabase.list('/friends')
    return this.refFriends.remove(id);
  }

  getFriends(): Observable<Friend[]> {
    if (this.userKey) {
      return this.refFriends.snapshotChanges().pipe(
        map(changes =>
          changes.map(
            c =>
              <Friend>{
                key: c.payload.key,
                ...c.payload.val(),
              }
          )
        ),
        catchError(errorRes => {
          return throwError(errorRes);
        })
      );
    }
    const emptyArrObs: Observable<Friend[]> = of([]);
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
    this.refUsers.update(key, body);
  }

  addProfilePicture(file: any) {
    const fullPath = 'profilePictures' + '/' + file.name;
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

  getWeather(location: string) {
    return this.http.get(this.apiUrl + `weather?address=${location}`);
  }

  deleteAllNotes() {
    return this.http.delete(
      'https://project0781-default-rtdb.europe-west1.firebasedatabase.app/notes.json'
    );
  }
}
