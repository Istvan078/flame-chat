import { Injectable } from '@angular/core';

import {
  AngularFireDatabase,
  AngularFireList,
  SnapshotAction,
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
import { CdkObserveContent } from '@angular/cdk/observers';
import { FilesModalComponent } from '../components/modals/files-modal/files-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
  messageTransferSub: BehaviorSubject<boolean> = new BehaviorSubject(false);
  chosenMsgThemeSubject: BehaviorSubject<any> = new BehaviorSubject('');

  userKeySubject: BehaviorSubject<any> = new BehaviorSubject('');
  userKeySubjectSubscription!: Subscription;

  userKey: any;

  constructor(
    private realTimeDatabase: AngularFireDatabase,
    private fireStorage: AngularFireStorage,
    private http: HttpClient,
    private modalRef: NgbModal
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

  // getFriendOnlineStat(userKey: string) {
  //   return new Observable(obs => {
  //     const ref = this.realTimeDatabase.list(`users/${userKey}`);
  //     const onlineState = { online: false };
  //     ref.query.on('child_changed', val => {
  //       if (typeof val.val() === 'boolean') {
  //         onlineState.online = val.val();
  //         console.log('***GETUSERPROFILE***');
  //         const sub = this.selectedFriendSubject.subscribe(val => {
  //           if (this.selectedFriendSubject.value === null) {
  //             ref.query.off('child_changed');
  //             sub.unsubscribe();
  //           }
  //         });
  //         obs.next(onlineState);
  //       }
  //     });
  //   });
  // }

  addFriends(friend: any, friendKey: string, userKey: string) {
    return this.realTimeDatabase
      .object(`users/${userKey}/friends/${friendKey}`)
      .update(friend);
  }

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

  // getLastMessageWithFr(userKey: string, friendKey: string) {
  //   const threeMthsAgo = new Date();
  //   threeMthsAgo.setMonth(threeMthsAgo.getMonth() - 3);
  //   const currTime = new Date().getTime();
  //   const ref = this.realTimeDatabase.list(`chats/${userKey}/${friendKey}`);
  //   ref.query
  //     .orderByChild('participants/2')
  //     .startAt(threeMthsAgo.getTime())
  //     .endAt(currTime)
  //     .limitToLast(1)
  //     .get()
  //     .then(val => console.log(val.val()));
  // }

  getUserMessagesRefactored(
    userUid: string,
    friendUid: string,
    userKey: string,
    friendKey: string,
    isGetLastMsgWithFr?: boolean
  ): Observable<Promise<any[]>> {
    if (friendUid) {
      const threeMthsAgo = new Date();
      threeMthsAgo.setMonth(threeMthsAgo.getMonth() - 3);
      return new Observable(obs => {
        const currTime = new Date().getTime();
        const promise1 = new Promise(res => {
          const ref2 = this.realTimeDatabase.list(
            `chats/${userKey}/${friendKey}`,
            ref2 => {
              return isGetLastMsgWithFr
                ? ref2
                    .orderByChild('participants/2')
                    .startAt(
                      ((userUid + friendUid) as string) +
                        '-' +
                        threeMthsAgo.getTime()
                    )
                    .endAt(((userUid + friendUid) as string) + '-' + currTime)
                    .limitToLast(1)
                : ref2
                    .orderByChild('participants/2')
                    .startAt(
                      ((userUid + friendUid) as string) +
                        '-' +
                        threeMthsAgo.getTime()
                    )
                    .endAt(((userUid + friendUid) as string) + '-' + currTime)
                    .limitToLast(15);
            }
          );
          ref2.valueChanges(['child_added']).subscribe(val => {
            return res(val);
          });
        });

        const promise2 = new Promise(res => {
          const ref3 = this.realTimeDatabase.list(
            `chats/${friendKey}/${userKey}`,
            ref3 => {
              return isGetLastMsgWithFr
                ? ref3
                    .orderByChild('message/senderId_receiverId')
                    .startAt(
                      `${friendUid}_${userUid}_${threeMthsAgo.getTime()}`
                    )
                    .endAt(`${friendUid}_${userUid}_${currTime}`)
                    .limitToLast(1)
                : ref3
                    .orderByChild('message/senderId_receiverId')
                    .startAt(
                      `${friendUid}_${userUid}_${threeMthsAgo.getTime()}`
                    )
                    .endAt(`${friendUid}_${userUid}_${currTime}`)
                    .limitToLast(15);
              // .equalTo(`${userUid}_${friendUid}`)
            }
          );
          ref3.valueChanges(['child_added']).subscribe(val => {
            res(val);
          });
        });
        const myAllMessagesArr = [promise1, promise2];
        const frAndMyMessages: Promise<any[]> = Promise.all(
          myAllMessagesArr
        ).then(res => {
          return res.flat();
        });
        obs.next(frAndMyMessages);
      });
    } else return of(new Promise<any[]>(res => res([])));
    // new Promise(res => res([]));
  }

  // getUserMessagesRefactored(
  //   userUid: string,
  //   friendUid: string,
  //   userKey: string,
  //   friendKey: string
  // ): Observable<Promise<any[]>> {
  //   if (friendUid) {
  //     return new Observable(obs => {
  //       const int = setInterval(() => {
  //         const promise1 = new Promise(res => {
  //           const ref2 = this.realTimeDatabase.list(
  //             `chats/${userKey}/${friendKey}`,
  //             ref2 => {
  //               return ref2
  //                 .orderByChild('key')
  //                 .startAt((userUid as string) + '_' + 0)
  //                 .endAt((userUid as string) + '_' + 90000)
  //                 .limitToLast(15);
  //             }
  //           );
  //           ref2.valueChanges(['child_added']).subscribe(val => {
  //             return res(val);
  //           });
  //         });

  //         const promise2 = new Promise(res => {
  //           const ref3 = this.realTimeDatabase.list(
  //             `chats/${friendKey}/${userKey}`,
  //             ref3 =>
  //               ref3
  //                 .orderByChild('key')
  //                 .startAt(`${friendUid}_${0}`)
  //                 .endAt(`${friendUid}_${90000}`)
  //                 .limitToLast(15)
  //           );
  //           ref3.valueChanges(['child_added']).subscribe(val => {
  //             res(val);
  //           });
  //         });
  //         const myAllMessagesArr = [promise1, promise2];
  //         const frAndMyMessages: Promise<any[]> = Promise.all(
  //           myAllMessagesArr
  //         ).then(res => {
  //           clearInterval(int);
  //           return res.flat();
  //         });
  //         obs.next(frAndMyMessages);
  //       }, 200);
  //     });
  //   } else return of(new Promise<any[]>(res => res([])));
  //   // new Promise(res => res([]));
  // }

  getScrolledMessages(userKey: string, friendKey: string) {
    const ref2 = this.realTimeDatabase.list(
      `chats/${friendKey}/${userKey}`,
      ref2 => ref2.orderByValue().limitToLast(15)
    );
    return ref2.valueChanges();
  }
  messageKeysArr: string[] = [];
  getMessageByKey(
    userKey: string,
    friendKey: string,
    number: string,
    userOrFriendId?: string
  ) {
    let value: any;
    this.realTimeDatabase
      .object(`chats/${friendKey}/${userKey}/${userOrFriendId}_${number}`)
      .query.get()
      .then(val => (value = val));
    return new Observable(obs => {
      const int = setInterval(() => {
        if (value && !this.messageKeysArr.includes(value?.key)) {
          obs.next(value.val());
          this.messageKeysArr.push(value.key);
          value = undefined;
          clearInterval(int);
        }
      }, 100);
    });
  }

  getNewMessages(userKey: string, friendKey?: string) {
    if (friendKey) {
      const ref = this.realTimeDatabase.list(
        `chats/${friendKey}/${userKey}`,
        ref2 => ref2.orderByChild('message/seen').equalTo(false).limitToLast(7)
      );
      return ref
        .snapshotChanges(['child_added'])
        .pipe(
          map(ch =>
            ch.map((c: any) => ({ key: c.payload.key, ...c.payload.val() }))
          )
        );
    }
  }

  getUpdatedMessages(userKey: string, friendKey: string) {
    const ref = this.realTimeDatabase.list(
      `chats/${userKey}/${friendKey}`,
      ref2 => ref2.orderByChild('message/timeStamp').limitToLast(7)
    );
    return ref
      .snapshotChanges(['child_changed'])
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
  async showProfPics(userEmail: string) {
    const profPicsArr = await this.getProfilePictures(userEmail);
    console.log(profPicsArr);
    const modal = this.modalRef.open(FilesModalComponent, {
      centered: true,
      animation: true,
    });
    modal.componentInstance.profPicsArr = profPicsArr;
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

  addMessage(body: Chat, userKey: string, friendKey: string) {
    const userChats = this.realTimeDatabase.list(
      `chats/${userKey}/${friendKey}`
    );
    return userChats.push(body);
  }

  updateMessage(
    key: any,
    body: Partial<Chat>,
    userKey: string,
    friendKey: string
  ) {
    const userChats = this.realTimeDatabase.list(
      `chats/${userKey}/${friendKey}`
    );
    return userChats.update(key, body);
  }

  deleteMessage(friendKey: string, userKey: string, chatKey: string) {
    return this.refChats.remove(`/${friendKey}/${userKey}/${chatKey}`);
  }

  deleteMessages() {
    this.refChats.remove();
  }

  getMessages(userKey: string, friendKey: string) {
    const userChats = this.realTimeDatabase.list(
      `chats/${userKey}/${friendKey}`
    );
    return userChats.snapshotChanges().pipe(
      map(changes =>
        changes.map(c => ({
          key: c.payload.key,
          ...(c.payload.val() as any),
        }))
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

  ///////////////////////// DEV FUNKCIÓK ///////////////////////////////

  getAllMessagesFromFriend(
    friendKey: string,
    userKey: string,
    friendUid: string,
    userUid: string
  ) {
    const threeMthsAgo = new Date();
    threeMthsAgo.setMonth(threeMthsAgo.getMonth() - 3);
    const ref = this.realTimeDatabase.list(
      'chats/' + friendKey + '/' + userKey,
      ref =>
        ref
          .orderByChild('message/senderId_receiverId')
          .startAt(`${friendUid}_${userUid}_${threeMthsAgo.getTime()}`)
          .endAt(`${friendUid}_${userUid}_${new Date().getTime()}`)
    );
    return ref.valueChanges();
  }

  /////////// SEGÍTŐ FUNKCIÓK ///////////////////
  removeMessages(chatkey: string) {
    this.refChats.remove(chatkey);
  }
  getOldMsgs() {
    return this.refChats.valueChanges();
  }
}
