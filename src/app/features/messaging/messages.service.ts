import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import { AngularFireDatabase, AngularFireList, AngularFireObject, PathReference, QueryFn } from '@angular/fire/compat/database';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import type firebase from 'firebase/compat/app';
import { Chat } from 'src/app/features/messaging/chat.model';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private readonly injector = inject(EnvironmentInjector);

  refChats!: AngularFireList<Chat>;

  selectedFriendSubject: BehaviorSubject<any> = new BehaviorSubject({});

  logicalSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);

  getAllMessagesSubject: BehaviorSubject<any> = new BehaviorSubject({});

  newMessageNotiSubject: BehaviorSubject<any> = new BehaviorSubject([]);

  haventSeenMsgsArr: BehaviorSubject<any> = new BehaviorSubject([]);

  messageTransferSub: BehaviorSubject<boolean> = new BehaviorSubject(false);

  chosenMsgThemeSubject: BehaviorSubject<any> = new BehaviorSubject('');

  isShowMessagesSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);

  userKey: any;

  constructor(private realTimeDatabase: AngularFireDatabase) {
    this.refChats = this.databaseList(`/chats`);
  }

  // AngularFire 21 reference factories use inject(), including from callbacks.
  private databaseList<T = any>(
    path: PathReference,
    queryFn?: QueryFn,
  ): AngularFireList<T> {
    return runInInjectionContext(this.injector, () =>
      this.realTimeDatabase.list<T>(path, queryFn),
    );
  }

  private databaseObject<T = any>(path: PathReference): AngularFireObject<T> {
    return runInInjectionContext(this.injector, () =>
      this.realTimeDatabase.object<T>(path),
    );
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
    isGetLastMsgWithFr?: boolean,
  ): Observable<Promise<any[]>> {
    if (friendUid) {
      const twentyFourMthsAgo = new Date();
      twentyFourMthsAgo.setMonth(twentyFourMthsAgo.getMonth() - 24);
      return new Observable(obs => {
        const currTime = new Date().getTime();
        const promise1 = new Promise(res => {
          const ref2 = this.databaseList(
            `chats/${userKey}/${friendKey}`,
            ref2 => {
              return isGetLastMsgWithFr
                ? ref2
                    .orderByChild('participants/2')
                    .startAt(
                      ((userUid + friendUid) as string) +
                        '-' +
                        twentyFourMthsAgo.getTime(),
                    )
                    .endAt(((userUid + friendUid) as string) + '-' + currTime)
                    .limitToLast(1)
                : ref2
                    .orderByChild('participants/2')
                    .startAt(
                      ((userUid + friendUid) as string) +
                        '-' +
                        twentyFourMthsAgo.getTime(),
                    )
                    .endAt(((userUid + friendUid) as string) + '-' + currTime)
                    .limitToLast(15);
            },
          );
          ref2.valueChanges(['child_added']).subscribe(val => {
            return res(val);
          });
        });

        const promise2 = new Promise(res => {
          const ref3 = this.databaseList(
            `chats/${friendKey}/${userKey}`,
            ref3 => {
              return isGetLastMsgWithFr
                ? ref3
                    .orderByChild('message/senderId_receiverId')
                    .startAt(
                      `${friendUid}_${userUid}_${twentyFourMthsAgo.getTime()}`,
                    )
                    .endAt(`${friendUid}_${userUid}_${currTime}`)
                    .limitToLast(1)
                : ref3
                    .orderByChild('message/senderId_receiverId')
                    .startAt(
                      `${friendUid}_${userUid}_${twentyFourMthsAgo.getTime()}`,
                    )
                    .endAt(`${friendUid}_${userUid}_${currTime}`)
                    .limitToLast(15);
              // .equalTo(`${userUid}_${friendUid}`)
            },
          );
          ref3.valueChanges(['child_added']).subscribe(val => {
            res(val);
          });
        });
        const myAllMessagesArr = [promise1, promise2];
        const frAndMyMessages: Promise<any[]> = Promise.all(
          myAllMessagesArr,
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
    const ref2 = this.databaseList(`chats/${friendKey}/${userKey}`, ref2 =>
      ref2.orderByValue().limitToLast(15),
    );
    return ref2.valueChanges();
  }

  messageKeysArr: string[] = [];

  getMessageByKey(
    userKey: string,
    friendKey: string,
    number: string,
    userOrFriendId?: string,
  ) {
    let value: any;
    this.databaseObject(
      `chats/${friendKey}/${userKey}/${userOrFriendId}_${number}`,
    )
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
      const ref = this.databaseList(`chats/${friendKey}/${userKey}`, ref2 =>
        ref2.orderByChild('message/seen').equalTo(false).limitToLast(7),
      );
      return ref
        .snapshotChanges(['child_added'])
        .pipe(
          map(ch =>
            ch.map((c: any) => ({ key: c.payload.key, ...c.payload.val() })),
          ),
        );
    }
  }

  getUpdatedMessages(userKey: string, friendKey: string) {
    const ref = this.databaseList(`chats/${userKey}/${friendKey}`, ref2 =>
      ref2.orderByChild('message/timeStamp').limitToLast(8),
    );
    return ref
      .snapshotChanges(['child_changed', 'child_added'])
      .pipe(
        map(ch =>
          ch.map((c: any) => ({ key: c.payload.key, ...c.payload.val() })),
        ),
      );
  }

  addMessage(body: Chat, userKey: string, friendKey: string) {
    const userChats = this.databaseList(`chats/${userKey}/${friendKey}`);
    return userChats.push(body);
  }

  updateMessage(
    key: any,
    body: Partial<Chat>,
    userKey: string,
    friendKey: string,
  ) {
    const userChats = this.databaseList(`chats/${userKey}/${friendKey}`);
    return userChats.update(key, body);
  }

  deleteMyMessage(friendKey: string, userKey: string, chatKey: string) {
    return this.refChats.remove(`/${userKey}/${friendKey}/${chatKey}`);
  }

  deleteAllMsgsWithFriend(userKey: string, friendKey: string) {
    const userChats = this.databaseList(`chats/${userKey}/${friendKey}`);
    const friendChats = this.databaseList(`chats/${friendKey}/${userKey}`);
    return Promise.all([userChats.remove(), friendChats.remove()]);
  }

  deleteMessages() {
    this.refChats.remove();
  }

  getMessages(userKey: string, friendKey: string) {
    const userChats = this.databaseList(`chats/${userKey}/${friendKey}`);
    return userChats.snapshotChanges().pipe(
      map(changes =>
        changes.map(c => ({
          key: c.payload.key,
          ...(c.payload.val() as any),
        })),
      ),
    );
  }

  /**
   * Realtime feliratkozás a beszélgetésre.
   * Címzett oldalon itt emeljük 'delivered'-re (✔✔), amikor ténylegesen megérkezett a készülékre.
   */
  listenConversation(userKey: string) {
    const newMessNumberRef = this.realTimeDatabase.database.ref(
      `users/${userKey}/friends/`,
    );
    this.listenMessDelHelper(newMessNumberRef, userKey, 'child_added');
    this.listenMessDelHelper(newMessNumberRef, userKey, 'child_changed');
  }

  listenMessDelHelper(
    newMessNumberRef: firebase.database.Reference,
    userKey: string,
    onAction: firebase.database.EventType,
  ) {
    newMessNumberRef.orderByChild('newMessSentTime').on(onAction, snap => {
      const friend = snap.val();
      if (!friend?.newMessageNumber) return;
      if (friend.newMessageNumber > 0) {
        this.databaseObject(`chats/${friend.friendKey}/${userKey}/`)
          .query.orderByChild('message/status')
          .equalTo('sent')
          .get()
          .then(val => {
            const obj = val.val();
            if (!obj) return;
            let nMessArr = Object.values(obj);
            let toUpdDelStatusArr: any[] = [];
            nMessArr.map((mess: any, i) => {
              if (mess.message.status === 'sent') {
                mess.message.status = 'delivered';
                mess.message.deliveredAt = new Date().getTime();
                toUpdDelStatusArr.push(mess);
                return mess;
              }
            });
            return toUpdDelStatusArr;
          })
          .then(nMessArr => {
            if (nMessArr?.length)
              nMessArr.map((mess: any) => {
                this.updateMessage(mess.key, mess, friend.friendKey, userKey);
                console.log('Message delivered!', mess);
              });
          });
      }
    });
  }

  ///////////////////////// DEV FUNKCIÓK ///////////////////////////////

  getAllMessagesFromFriend(
    friendKey: string,
    userKey: string,
    friendUid: string,
    userUid: string,
  ) {
    const threeMthsAgo = new Date();
    threeMthsAgo.setMonth(threeMthsAgo.getMonth() - 3);
    const ref = this.databaseList('chats/' + friendKey + '/' + userKey, ref =>
      ref
        .orderByChild('message/senderId_receiverId')
        .startAt(`${friendUid}_${userUid}_${threeMthsAgo.getTime()}`)
        .endAt(`${friendUid}_${userUid}_${new Date().getTime()}`),
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
