import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { Chat } from 'src/app/models/chat.model';
import { Friends, UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { MatAccordion } from '@angular/material/expansion';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modals/modal/modal.component';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FilesModalComponent } from '../modals/files-modal/files-modal.component';
import { HttpClient } from '@angular/common/http';
import * as deepMerge from 'deepmerge';
import { ToastService } from 'src/app/services/toast.service';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import {
  animate,
  group,
  keyframes,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

type Notification = {
  displayName: string;
  message: string;
  profilePhoto: string;
  timeStamp: string;
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  animations: [
    trigger('slide-in-out', [
      state(
        'in-1',
        style({
          transform: 'translateX(0) scale(0.2)',
          opacity: 1,
        })
      ),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateX(-50%)' }),
        animate(2000),
      ]),
      transition('* => void', [
        animate(
          300,
          style({
            transform: 'translateX(50%)',
            opacity: 0,
          })
        ),
      ]),
    ]),
    trigger('slide-in-keyframed', [
      state(
        'in-0',
        style({
          transform: 'translateX(0) scale(0.2)',
          opacity: 1,
        })
      ),
      transition('void => *', [
        animate(
          1000,
          keyframes([
            style({
              opacity: 0,
              transform: 'translateX(-50%)',
              offset: 0,
            }),
            style({
              transform: 'translateX(-25%)',
              opacity: 0.5,
              offset: 0.3,
            }),
            style({
              transform: 'translateX(-10%)',
              opacity: 1,
              offset: 0.6,
            }),
            style({
              transform: 'translateX(0)',
              opacity: 1,
              offset: 1,
            }),
          ])
        ),
      ]),
    ]),
    trigger('fade-in', [
      state(
        'in-2',
        style({
          opacity: 0,
          transform: 'scale(0)',
        })
      ),
      state(
        'normal',
        style({
          opacity: 1,
          transform: 'scale(1)',
        })
      ),
      transition('in-2 => normal', [
        animate(
          500,
          keyframes([
            style({
              transform: 'scale(0.2)',
              opacity: 0.3,
              offset: 0.3,
            }),
            style({
              transform: 'scale(0.5)',
              opacity: 1,
              offset: 0.6,
            }),
            style({
              transform: 'scale(1)',
              opacity: 1,
              offset: 1,
            }),
          ])
        ),
      ]),
    ]),
    trigger('slide-in-keyframed-3', [
      state(
        'normal',
        style({
          transform: 'translateX(0) scale(0)',
          opacity: 0,
        })
      ),
      state(
        'in-2',
        style({
          transform: 'translateX(0) scale(1)',
          opacity: 1,
        })
      ),
      transition('normal => in-2', [
        animate(
          2000,
          keyframes([
            style({
              opacity: 0,
              transform: 'translateX(-50%) scale(0)',
              offset: 0,
            }),
            style({
              transform: 'translateX(-25%) scale(0.5)',
              opacity: 0.5,
              offset: 0.3,
            }),
            style({
              transform: 'translateX(-10%)',
              opacity: 1,
              offset: 0.6,
            }),
            style({
              transform: 'translateX(0) scale(1)',
              opacity: 1,
              offset: 1,
            }),
          ])
        ),
      ]),
    ]),
  ],
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild(MatAccordion) accordion!: MatAccordion;
  @ViewChild('slideToggle') slideToggle!: MatSlideToggle;
  // @HostListener('click') isUserOnline() {
  //   this.isOnline();
  // }

  // ANIMÁCIÓVAL KAPCSOLATOS //
  chatAnimationState: string = 'normal';

  // FELHASZNÁLÓVAL KAPCSOLATOS //
  userProfiles: UserClass[] = [];
  userNotFriends: any[] = [];
  userFriends?: Friends[] = [];
  seenMeArr: any[] = []; // KIK NÉZTÉK MEG A PROFILOM
  userProfile: UserClass = new UserClass();
  signAsFriend: UserClass = new UserClass();
  selectedFriend: any = {};
  isSAdmin: boolean = false;
  isUserProfileOn: boolean = false;
  showFriendsToChoose: boolean = false;
  showAllFriends: boolean = false;
  friendsOn: boolean = false;
  isUserOnlineNow: boolean = false;

  // ISMERŐS KERESÉSE //
  friendSearch: string = '';

  // ÜZENET KERESÉSE //
  searchWord: string = '';

  // ÜZENETEKKEL KAPCSOLATOS //
  messages: Chat[] = [];
  allChatsArray: any[] = [];
  visibleMessages: any[] = [];
  haventSeenMessagesArr?: any[] = [];
  messFromSelFriendArr: any[] = [];
  showFriendsMess: any[] = [];
  urlText: any[] = [];
  textMessages: any[] = [];
  message: Chat = new Chat();
  editMessage: boolean = false;
  sendPrivateMessageOn: boolean = false;
  messageButtonClicked: boolean = false;
  userMessages: boolean = false;
  arePostsOn: boolean = false;
  areMyPostsOn: boolean = false;
  isMessageOn: boolean = false;
  subscribedForNotifications: boolean = false;

  // POSZTOKKAL KAPCSOLATOS //
  postsNotificationNumber: number = 0;
  myPostsNotificationNumber: number = 0;
  seenPosts: any[] = [];
  seenMyPosts: any[] = [];

  // FÁJLOKKAL KAPCSOLATOS //
  selectedFiles: any[] = [];
  filesArr: any[] = [];
  sentFilesArr: any[] = [];
  uploadFinished: boolean = true;

  // PUSH NOTIFICATIONS-EL KAPCSOLATOS //
  friendPushSub: any;
  myPushSubscription!: PushSubscription;

  // TOAST //
  toastVal: any = {};

  // SUBJECTHEZ //
  authNull = 2;

  // FELIRATKOZÁSOK //
  userLoggedInSubscription: Subscription = Subscription.EMPTY;
  isSuperAdminSubscription: Subscription = Subscription.EMPTY;
  usersSubscription: Subscription = Subscription.EMPTY;
  userFriendSubjectSub: Subscription = Subscription.EMPTY;
  getAllMessagesSubjectSub: Subscription = Subscription.EMPTY;
  filesBehSubjectSub: Subscription = Subscription.EMPTY;
  haventSeenMsgsArrSubjSub: Subscription = Subscription.EMPTY;
  messSubscription: Subscription = Subscription.EMPTY;
  postsNotiSub: Subscription = Subscription.EMPTY;
  isSubscribedForNotSub: Subscription = Subscription.EMPTY;
  // OBSERVABLES //
  customInterval$ = new Observable(subscriber => {
    let timesExecuted = 0;
    const interval = setInterval(() => {
      // subscriber.error();
      if (timesExecuted > 5) {
        clearInterval(interval);
        subscriber.complete(); // megtisztítja a subscription-t, nem lesz további érték azt is mondom vele
        return;
      }
      console.log('új érték kisugárzása');
      subscriber.next({ message: 'új érték' }); // itt azt állítjuk be MIKOR történjen meg a next esemény!!!
    }, 2000);
  });

  onAnimate() {
    console.log(this.chatAnimationState);
    this.chatAnimationState =
      this.chatAnimationState === 'normal' ? 'in-2' : 'normal';
  }

  animateMessages() {
    console.log(this.chatAnimationState);
    this.chatAnimationState =
      this.chatAnimationState === 'in-2' ? 'normal' : 'normal';
  }

  constructor(
    private auth: AuthService,
    private base: BaseService,
    private router: Router,
    private ngbModal: NgbModal,
    private firestore: FirestoreService,
    private http: HttpClient,
    private toastService: ToastService
  ) {}
  ngOnInit() {
    // A FELHASZNÁLÓ ONLINE-E ESEMÉNYFIGYELŐ //
    window.addEventListener('click', async e => {
      if (!this.isUserOnlineNow) {
        await this.base.updateUserData({ online: true }, this.userProfile?.key);
        this.isUserOnlineNow = true;
      }
    });
    // A FELHASZNÁLÓ OFFLINE-E ESEMÉNYFIGYELŐ //
    window.addEventListener('blur', async e => {
      if (this.isUserOnlineNow) {
        await this.base.updateUserData(
          { online: false },
          this.userProfile?.key
        );
        await this.base.updateUserData(
          { lastTimeOnline: new Date().getTime() },
          this.userProfile?.key
        );
        this.isUserOnlineNow = false;
      }
    });
    this.test();
    this.auth.authNullSubject.subscribe(authNull => {
      this.authNull = authNull;
    });
    if (
      Object.keys(this.base.userFriendsSubject.getValue()).length !== 0 &&
      !this.userFriends?.length
    ) {
      this.userFriendSubjectSub = this.base.userFriendsSubject.subscribe(
        uFrs => {
          this.userFriends = uFrs.userFriends;
          this.userNotFriends = uFrs.userNotFriends;
        }
      );
    }

    this.getAllMessagesSubjectSub = this.base.getAllMessagesSubject.subscribe(
      obj => {
        if (obj.allChatsArray) {
          this.allChatsArray = obj.allChatsArray;
        }
        if (obj.showFriendsMess) {
          this.showFriendsMess = obj.showFriendsMess;
        }
        if (obj.haventSeenMessagesArr) {
          this.haventSeenMessagesArr = obj.haventSeenMessagesArr;
        }
      }
    );
    this.haventSeenMsgsArrSubjSub = this.base.haventSeenMsgsArr.subscribe(
      hSMArr => {
        this.haventSeenMessagesArr = hSMArr;
      }
    );
    new Promise(res => {
      this.userLoggedInSubscription = this.auth
        .getUserLoggedInSubject()
        .subscribe((user: any) => {
          // felhasznaloi adatok lekerese
          if (user)
            this.base.getUserProfiles().subscribe((userProfiles: any[]) => {
              this.userProfiles = userProfiles;
              this.userProfile = userProfiles.find(
                (userProfile: any) => userProfile.uid === user.uid
              );
              if (this.userProfile && !this.userProfile.birthDate) {
                this.router.navigate(['profile/' + user.uid]);
              }
              // userKey átadása base service-nek
              if (this.userProfile?.key) {
                this.base.userKeySubject.next(this.userProfile?.key);
                res('**** SIKERES FELHASZNÁLÓI PROFIL LEKÉRÉS ****');
              }
              this.refreshSharedPosts();
              this.refreshMyPosts();
              this.getNewPostsNotification();
              this.getNotSeenMyPostsNotification();
            });
        });
    }).then(res => {
      this.isSubscribedForNotSub = this.isSubscribedForNotifications();
      this.isSubscribedForNotSub.unsubscribe();
      let docIdsArr: any[] = [];
      console.log(res);
      if (this.firestore.filesBehSubject.value.length === 0) {
        this.firestore
          .getFilesFromChat(this.userProfile.key as string)
          .subscribe((data: any) => {
            data.forEach((doc: any) => {
              if (!docIdsArr.includes(doc.payload.doc.id)) {
                docIdsArr.push(doc.payload.doc.id);
                this.sentFilesArr.push({
                  docId: doc.payload.doc.id,
                  ...doc.payload.doc.data(),
                });
              }
            });
            console.log('**** FÁJLOK LEKÉRVE ****');
            this.firestore.filesBehSubject.next(this.sentFilesArr);
          });
      }
      // baratok listajanak lekerese
      if (!this.userProfile?.uid) return;
      if (this.userProfile?.uid) {
        const getFriendsSub = this.getFriendsAndNotFriends().subscribe({
          next: (res: any) => {
            this.base.profileSeenSubject.next(this.userFriends);
            console.log(res);
            // új üzenetek lekérése
            this.messSubscription = this.getNewMessages();
          },
          complete: () => {
            console.log('***OBSERVABLE BEFEJEZŐDÖTT***');
            getFriendsSub.unsubscribe();
          },
        });
      }
    });
    this.isSuperAdminSubscription = this.auth.isSuperAdmin.subscribe(
      value => (this.isSAdmin = value)
    );
  }

  ////////////////////// LEÍRÁS ///////////////////////////
  // Ismerősök és nem ismerősök lekérése, beállítása //
  getFriendsAndNotFriends() {
    return new Observable(observer => {
      const userProfile = this.userProfile;
      if (this.userProfile.uid && !this.userProfile.friends?.length)
        this.base.getFriends()?.subscribe(frs => {
          this.userProfile = userProfile;
          this.friendsOn = true;
          userProfile.friends = frs;
          let friendProfile: any = {};
          const seenMeArr = this.userProfile.friends
            ?.filter(f => {
              return f.seenMe === true;
            })
            ?.map((fr, i, arr) => {
              friendProfile = this.userProfiles.find(
                uP => uP.uid === fr.friendId
              );
              const friend = Object.assign({}, ...arr);
              friend.displayName = friendProfile.displayName;
              friend.profilePicture = friendProfile.profilePicture;
              friend.email = friendProfile.email;
              friend.friendKey = fr.key;
              console.log('-----map lefutott----');
              return friend;
            });

          this.subjectValueTransfer(seenMeArr, this.base.profileSeenSubject);
          // barát Uid-k tömb
          let friendsUids: any[] = [];
          // barátok tömb
          let friendsTomb: any[] = [];

          const userProfilesCopy: any[] = [...this.userProfiles];
          const userProfileCopy = { ...this.userProfile };

          if (
            Object.keys(this.base.userFriendsSubject.getValue()).length === 0 ||
            this.authNull === null
          ) {
            const userProfilesUids = userProfilesCopy.map(uProfs => uProfs.uid);
            userProfileCopy.friends?.forEach(f => {
              const prof = this.userProfiles.find(uP => {
                return f.friendId === uP.uid;
              });
              if (f.seenMe === undefined) {
                f.seenMe = false;
                this.base.updateFriend(f.key, {
                  seenMe: f.seenMe,
                } as any);
              }
              friendsUids.push(f.friendId);
              if (userProfilesUids.includes(f.friendId)) {
                friendsTomb.push({
                  friendKey: f['key'],
                  friendId: f.friendId,
                  seenMe: f.seenMe,
                  messaging: f.messaging,
                  displayName: prof?.displayName,
                  profilePicture: prof?.profilePicture,
                  email: prof?.email,
                  online: prof?.online,
                });
              }
            });
          }

          //////////////////// LEÍRÁS ///////////////////
          // nem baratok kiszűrése //
          if (
            Object.keys(this.base.userFriendsSubject.getValue()).length === 0 ||
            this.authNull === null
          ) {
            const userNotFriendsProf: any[] = this.userProfiles.filter(
              item =>
                !friendsUids.includes(item.uid) && item.uid !== userProfile.uid
            );
            //  nem baratok tomb beállítása
            this.userNotFriends = userNotFriendsProf;
          }
          if (
            Object.keys(this.base.userFriendsSubject.getValue()).length === 0 ||
            this.authNull === null
          ) {
            this.userFriends = friendsTomb;
            // subjecttel átküldi a userFriendst
            this.subjectValueTransfer(
              this.userFriends,
              this.base.profileSeenSubject
            );
            const forFriendsSubject = {
              userFriends: this.userFriends,
              userNotFriends: this.userNotFriends,
            };
            this.subjectValueTransfer(
              forFriendsSubject,
              this.base.userFriendsSubject
            );
            this.subjectValueTransfer(2, this.auth.authNullSubject);
            setTimeout(() => {
              this.setDefaultProfilePic();
            }, 200000);
            // if (this.userProfile?.uid) this.isOnline();
          }
          observer.next('**** SIKERES BARÁTOK LISTÁJA LEKÉRÉS ****');
          observer.complete();
        });
    });
  }

  async updateUserNotifications(event: any) {
    const isSubscribed = event.checked;
    let wantsToUnsub = false;
    if (!isSubscribed) {
      const areUSureToUnsub = this.ngbModal.open(ModalComponent, {
        animation: true,
        fullscreen: true,
      });
      areUSureToUnsub.componentInstance.isWantToUnsub = true;
      try {
        const choiceResult = await areUSureToUnsub.result;
        if (choiceResult === 'Igen') {
          wantsToUnsub = true;
        }
      } catch (err) {
        this.slideToggle.checked = true;
        console.log(err);
      }
    }
    if (isSubscribed) {
      if (Notification.permission === 'default')
        await Notification.requestPermission();
      if (Notification.permission === 'denied') {
        alert(
          'Az értesítések jelenleg le vannak tiltva. Kérjük, engedélyezze azokat a böngésző beállításaiban és próbálja újra.'
        );
        this.slideToggle.checked = false;
        return;
      }
    }
    if (this.myPushSubscription) {
      let JSONed = this.myPushSubscription.toJSON();
      this.firestore
        .getUserNotiSubscriptionReformed(this.userProfile.key, JSONed.endpoint!)
        .then(docs => {
          if (docs.empty && isSubscribed && !wantsToUnsub)
            this.firestore.saveUserNotiSubscription(
              this.userProfile.key,
              JSONed
            );
          docs.forEach(async doc => {
            if (doc.exists && !isSubscribed && wantsToUnsub) {
              await this.firestore.deleteUserNotificationSub(
                this.userProfile.key,
                doc.id
              );
              this.myPushSubscription.unsubscribe();
            }

            if (!doc.exists && isSubscribed && !wantsToUnsub)
              this.firestore.saveUserNotiSubscription(
                this.userProfile.key,
                JSONed
              );
          });
        });
    }
  }

  signAsAFriend(user: UserClass) {
    const friend: {} = {
      friendId: user.uid,
      friendKey: user.key,
    };
    this.base.addFriends(friend, user.key)?.then(() => {
      const modalRef = this.ngbModal.open(ModalComponent, {
        centered: true,
      });
      modalRef.componentInstance.friendName = user.displayName;
      this.toastVal = user;
      modalRef.componentInstance.name = 'Ismerősnek jelölve.';
      this.base.userFriendsSubject.next({});
      this.getFriendsAndNotFriends().subscribe(() => {
        this.filterShowFriendsMessArr();
        this.base.getAllMessagesSubject.next({
          showFriendsMess: this.showFriendsMess,
        });
      });
    });
  }

  removeFriend(friend: any) {
    this.base.removeFriend(friend).then(() => {
      const modalRef = this.ngbModal.open(ModalComponent, {
        ariaLabelledBy: 'modal-basic-title',
        centered: true,
      });
      modalRef.componentInstance.name = 'Törölve az ismerősök közül.';
      if (this.toastVal.uid == friend.friendId) {
        modalRef.componentInstance.friendName = this.toastVal.displayName;
      }
      this.base.userFriendsSubject.next({});
      this.getFriendsAndNotFriends().subscribe(() => {
        this.filterShowFriendsMessArr();
        this.base.getAllMessagesSubject.next({
          showFriendsMess: this.showFriendsMess,
        });
      });
    });
  }

  setDefaultProfilePic() {
    this.userProfiles.map(uP => {
      if (!uP.profilePicture) {
        uP.profilePicture =
          'https://img.freepik.com/free-vector/user-blue-gradient_78370-4692.jpg?t=st=1718095085~exp=1718098685~hmac=dabbb0cd71b6a040cd9dd79f125a765c55fa19402edc1701c52abf887aadfb05&w=1060';
        this.base.updateUserData({ profilePicture: uP.profilePicture }, uP.key);
      }
    });
  }

  changeTimeStampFormatForAllMessages() {
    // this.base.getMessages().subscribe((mess: any) => {
    //   mess.map((msg: Chat) => {
    //     if (msg.message)
    //       (msg.message.timeStamp as any) = new Date(
    //         msg.message?.timeStamp as any
    //       ).getTime();
    //     this.base.updateMessage(msg.key, msg);
    //   });
    // });
  }

  isSubscribedForNotifications() {
    return new Observable(observer => {
      const interval = setInterval(async () => {
        this.myPushSubscription = this.auth.swPushh();
        if (this.myPushSubscription?.endpoint && this.userProfile?.key) {
          let JSONed = this.myPushSubscription?.toJSON();
          const querySnapShot =
            await this.firestore.getUserNotiSubscriptionReformed(
              this.userProfile?.key,
              JSONed.endpoint!
            );
          if (querySnapShot.empty) this.subscribedForNotifications = false;
          else this.subscribedForNotifications = true;
          observer.next(this.myPushSubscription);
          observer.complete();
          clearInterval(interval);
        }
        console.log('FUT AZ INTERVAL');
      }, 200);
      setTimeout(async () => {
        console.log(`TIMEOUT LEJÁRT`);
        let JSONed = this.myPushSubscription?.toJSON();
        if (JSONed?.endpoint) {
          const querySnapShot =
            await this.firestore.getUserNotiSubscriptionReformed(
              this.userProfile?.key,
              JSONed.endpoint
            );
          console.log(querySnapShot);
          console.log(JSONed);
          if (querySnapShot.empty) {
            console.log('NINCS ILYEN FELIRATKOZÁS MÉG');
            const doYouSubscribeModal = this.ngbModal.open(ModalComponent, {
              animation: true,
              fullscreen: true,
            });
            doYouSubscribeModal.componentInstance.isSubscribedToNotif = false;
            const choiceResult = await doYouSubscribeModal.result;
            console.log(choiceResult);
            if (choiceResult === 'Igen') {
              await this.updateUserNotifications({ checked: true });
              this.subscribedForNotifications = true;
            }
          }
          if (JSONed.endpoint) observer.complete();
        } else if (!this.isSAdmin) {
          console.log('LE VAN TILTVA AZ ÉRTESÍTÉSEK A BÖNGÉSZŐBEN');
          const doYouSubscribeModal = this.ngbModal.open(ModalComponent, {
            animation: true,
            fullscreen: true,
          });
          doYouSubscribeModal.componentInstance.isSubscribedToNotif = false;
          const choiceResult = await doYouSubscribeModal.result;
          console.log(choiceResult);
          if (choiceResult === 'Igen') {
            await this.updateUserNotifications({ checked: true });
            observer.complete();
          }
        }
        clearInterval(interval);
      }, 5000);
      if (this.myPushSubscription?.endpoint)
        this.subscribedForNotifications = true;
    }).subscribe(val => console.log(val));
  }

  toUserProfile() {
    this.isUserProfileOn = true;
    this.router.navigate([`profile/${this.userProfile.uid}`]);
  }

  getMessageUser(user: any, i: number) {
    this.selectedFriend = user; // objektum
    this.sendPrivateMessageOn = true;
    this.userMessages = true;
    this.isMessageOn = true;
    new Promise((res, rej) => {
      if (this.userProfile.uid)
        this.base
          .getUserMessagesRefactored(
            this.userProfile.uid,
            this.selectedFriend.friendId
          )
          ?.then(msgs => {
            this.allChatsArray = msgs;
            this.runMessagesSubjectValueTransfer();
            this.getVisibleMessagesForSelectedFriend();
            res('-----ÜZENETEK LEKÉRVE-----');
            this.animateMessages();
          });
    }).then(res => {
      console.log(res);
      this.updateSeenMessagesAndViewTime(user);
    });

    //////////////////// LEÍRÁS ///////////////////////////
    // Fájlok feltöltéséhez használt Subject, elküldöttfájlok tömb
    // adatainak beállítása subject segítségével
    this.filesBehSubjectSub = this.firestore.filesBehSubject.subscribe(
      flArr => (this.sentFilesArr = flArr)
    );

    //////////////////// LEÍRÁS ///////////////////////////
    // elküldött fájlok tömbből kiszűri az adott barátnak küldött
    // fájlokat és a barát által nekem küldött fájlokat
    this.sentFilesArr = this.sentFilesArr.filter(file => {
      return (
        (file.receiverId === this.selectedFriend.friendId &&
          file.files.length !== 0) ||
        file.senderId === this.selectedFriend.friendId
      );
    });
  }

  deleteFile(files: any[], docId: string, i: number) {
    files.forEach((file: any) =>
      this.firestore.deleteFilesFromStorage(
        `fromChats/${this.userProfile.email}/files`,
        file.fileName
      )
    );

    console.log(files);
    console.log(i);
    this.firestore
      .deleteFilesFromFirestore(docId, this.userProfile.key)
      .then(val => {
        this.sentFilesArr.splice(i, 1);
        console.log('----FÁJL TÖRÖLVE----', val);
        this.firestore.filesBehSubject.next(this.sentFilesArr);
      });
    // this.sentFilesArr
    //   .flatMap(fStoreDoc => fStoreDoc.files)
    //   .forEach(file =>
    //     this.firestore.deleteFilesFromStorage(
    //       `fromChats/${this.userProfile.email}/files`,
    //       file.fileName
    //     )
    //   );
  }

  updateSeenMessagesAndViewTime = (user: any) => {
    return new Promise((res, rej) => {
      this.updateSeenMessages();
      // Üzenetek a kiválasztott baráttól tömb iteráció
      this.visibleMessages.map(mess => {
        //////////////// LEÍRÁS  ////////////////////////
        // Ha van új üzenet és ez a legelső üzenet a baráttól, akkor frissítsük
        // az adatbázisban a baráttal való messaging tulajdonságot true értékre.
        if (mess.message.seen === false) {
          if (user.messaging === undefined) {
            const startMessaging = { messaging: true };
            this.base
              .updateFriend(user.friendKey, startMessaging as any)
              .then(() => {
                for (const usr of this.showFriendsMess) {
                  if (usr.friendKey === user.friendKey) {
                    usr.messaging = true;
                  }
                }
              });
          }
        }
      });
      res('Baráttól származó üzenetek beállítása megtörtént.');
    }).then(res => {
      /////////////////// LEÍRÁS ////////////////////////
      // Mikor írta az üzenetet beállítása a calcMinutesPassed() //
      // metódus segítségével(formázva)) //
      this.allChatsArray = this.allChatsArray.map(mess => {
        if (!mess.message.viewTimeStamp || mess.message.viewTimeStamp == '') {
          mess.message.viewTimeStamp = this.calcMinutesPassed(
            mess.message.timeStamp
          );
        }
        // az iteráció végén visszaad minden üzenetet(módosítva)
        return mess;
      });
    });
  };

  getVisibleMessagesForSelectedFriend(): any[] {
    // Kiszűröm a kiválasztott felhasználóhoz tartozó üzeneteket
    const selectedFriendMessages = this.allChatsArray.filter((message: any) => {
      return (
        (message.message.senderId === this.selectedFriend.friendId &&
          message.participants[1] === this.userProfile.uid) ||
        (message.message.senderId === this.userProfile.uid &&
          message.participants[1] === this.selectedFriend.friendId)
      );
    });

    selectedFriendMessages.map(mess => {
      mess.message.viewTimeStamp = this.calcMinutesPassed(
        mess.message.timeStamp
      );
      mess.message.timeStamp = new Date(mess.message.timeStamp).getTime();
    });

    selectedFriendMessages.sort((a: any, b: any) => {
      if (a.message.timeStamp < b.message.timeStamp) return 1;
      else return -1;
    });

    // Kiválasztom az első 5 üzenetet
    this.visibleMessages = selectedFriendMessages.slice(0, 10);
    // Leszűröm az urlt tartalmazó üzeneteket és elmentem egy tömbbe
    const urlMessages: Chat[] = this.visibleMessages.filter(mess =>
      mess.message.message.includes('https://')
    );
    // Leszűröm a csak szöveget tartalmazó üzeneteket és elmentem egy tömbbe
    this.textMessages = this.visibleMessages.filter(
      mess => !mess.message.message.includes('https://')
    );

    // kiszedem csak az url-t tartalmazó részt mindegyik üzenetből a szövegből és belerakom egy tömbbe
    urlMessages.map((mess, i) => {
      if (
        !this.urlText.includes(mess.key) &&
        mess.message.message.includes(' ')
      ) {
        const transformedUrl = mess.message.message.slice(
          mess.message.message.indexOf('https://'),
          mess.message.message.indexOf(
            ' ',
            mess.message.message.indexOf('https://')
          )
        );
        const formattedText1stHalf = mess.message.message.slice(
          0,
          mess.message.message.indexOf(transformedUrl)
        );
        const formattedText2ndHalf = mess.message.message.slice(
          mess.message.message.indexOf(
            ' ',
            mess.message.message.indexOf(transformedUrl)
          )
        );
        this.urlText.push(
          {
            url: transformedUrl,
            text1stHalf: formattedText1stHalf,
            text2ndHalf: formattedText2ndHalf,
            chatId: mess.key,
          },
          mess.key
        );
      } else if (
        !mess.message.message.includes(' ') &&
        !this.urlText.includes(mess.key)
      ) {
        this.urlText.push(
          { url: mess.message.message, chatId: mess.key },
          mess.key
        );
      }
    });
    // this.visibleMessages.map(mess => {
    //   if (
    //     !mess.message.seen &&
    //     mess.message.senderId === this.selectedFriend.friendId
    //   ) {
    //     mess.message.seen = true;
    //     this.base.updateMessage(mess.key, mess);
    //   }
    // });
    return this.visibleMessages;
  }

  updateSeenMessages() {
    // látott üzenetek kiszűrése a tömbből
    console.log(this.haventSeenMessagesArr);
    this.haventSeenMessagesArr = this.haventSeenMessagesArr?.map(mess => {
      if (mess.message.senderId === this.selectedFriend.friendId) {
        console.log(mess);
        mess.message.seen = true;
        this.base.updateMessage(mess.key, mess);
        return undefined;
      }
      if (mess.message.senderId !== this.selectedFriend.friendId) {
        return mess;
      }
    });
    this.haventSeenMessagesArr = this.haventSeenMessagesArr?.filter(
      mess => mess !== undefined
    );
    this.filterShowFriendsMessArr();
    this.subjectValueTransfer(
      this.haventSeenMessagesArr,
      this.base.newMessageNotiSubject
    );
    this.runMessagesSubjectValueTransfer();
  }

  getNewMessages() {
    const userProfile = this.userProfile;
    return this.base.getNewMessages().subscribe(mess => {
      this.filterShowFriendsMessArr();
      let msgArr: any[] = [];
      if (mess.length) {
        msgArr = mess;
        let keyArr: any[] = [];
        this.allChatsArray.map((jSM: any) => {
          keyArr.push(jSM.key);
        });
        msgArr = msgArr.filter(
          msg =>
            !keyArr.includes(msg.key) &&
            msg.message.seen === false &&
            msg.message.senderId != userProfile?.uid &&
            msg.participants[1] === userProfile?.uid
        );
      }

      for (let msg of msgArr) {
        msg.message.viewTimeStamp = this.calcMinutesPassed(
          new Date(msg.message.timeStamp)
        );
        // const participants0Uid = msg.participants[0].split('-').shift();
        if (msg.participants[1] === userProfile?.uid) {
          this.haventSeenMessagesArr?.push(msg);
          this.allChatsArray.unshift(msg);
          this.filterShowFriendsMessArr();
        }
      }
      if (this.userMessages) this.updateSeenMessages();
      this.subjectValueTransfer(
        this.haventSeenMessagesArr,
        this.base.newMessageNotiSubject
      );
      this.runMessagesSubjectValueTransfer();
      this.getVisibleMessagesForSelectedFriend();
    });
  }

  ////////////////  LEÍRÁS  /////////////
  // Ha még nincs levelezés a 2 ember között beállítom hogy legyen //
  firstMessageToFriend(mess: any) {
    const startMessaging = { messaging: true };
    this.base.updateFriend(mess.friendKey as string, startMessaging as any);
    this.showFriendsToChoose = false;
    mess.messaging = true;
  }

  selectedFs($event: any) {
    this.uploadFinished = false;
    this.selectedFiles = Array.from($event.target.files);
  }

  uploadFiles() {
    let arr: any = [];
    this.selectedFiles.map((file: any) => {
      const promise = this.firestore
        .addFilesFromMessages(this.userProfile, file)
        ?.then((val: any) => {
          arr.push(val.metadata.name);
          if (arr.length === this.selectedFiles.length) {
            this.selectedFiles = [];
            const fileModal = this.ngbModal.open(FilesModalComponent, {
              centered: true,
            });
            fileModal.componentInstance.uploadTrue = true;
            this.uploadFinished = true;
          }
        })
        .catch(err => {
          arr.push('Meglévő fájl');
          console.log('Már van ilyen fájl az adatbázisban');

          if (arr.length === this.selectedFiles.length) {
            this.selectedFiles = [];
            const fileModal = this.ngbModal.open(FilesModalComponent, {
              centered: true,
            });
            fileModal.componentInstance.uploadTrue = true;
            this.uploadFinished = true;
          }
        });
    });

    this.firestore.filesSubject.subscribe((files: {}) => {
      this.filesArr.push(files);
    });
  }

  deleteUserData(id: any) {
    const toDeleteProfiles = this.userProfiles.filter(uP => {
      return uP.uid === 'NRQ2kFyKrpN1rTSRJ0gcna1DzdK2';
    });
    toDeleteProfiles.map(prof => {
      this.base.deleteUserData(prof.key);
    });
  }

  test() {}

  addMessage() {
    new Promise((res, rej) => {
      const actualTime = new Date().getTime();
      console.log(actualTime);
      if (this.userProfile.uid)
        this.message.message.senderId = this.userProfile.uid;
      this.message.message.timeStamp = actualTime as any;
      this.message.participants[0] =
        this.userProfile.uid + '-' + new Date().getTime();
      this.message.participants[1] = this.selectedFriend.friendId;
      this.message.participants[2 as any] =
        this.userProfile.uid +
        this.selectedFriend.friendId +
        '-' +
        new Date().getTime();
      this.message.message.displayName = this.userProfile.displayName!;
      this.message.message.email = this.userProfile.email as string;
      this.message.message.profilePhoto = this.userProfile.profilePicture;
      if (this.message.message)
        this.base.sendMessNotificationEmail(
          this.selectedFriend,
          this.message,
          this.userProfile
        );
      this.message._setKey = this.userProfile.uid + this.randomIdGenerator();
      const messageCopy = deepMerge.all([this.message]);
      this.allChatsArray.unshift(messageCopy);
      this.getVisibleMessagesForSelectedFriend();
      this.base.getAllMessagesSubject.next({
        allChatsArray: this.allChatsArray,
      });
      res('Üzenet tulajdonságai beállítva, üzenet objektum lemásolva.');
    }).then(res => {
      this.base.updateMessage(this.message['key'], this.message).then(() => {
        this.message.message.message = '';
        console.log(res, 'Sikeres üzenetfelvitel az adatbázisba.');
      });
    });

    if (this.filesArr.length) {
      const selectedFriend = this.userProfiles.find(
        usr => usr.uid === this.selectedFriend.friendId
      );

      const dataForFiles = {
        files: this.filesArr,
        chatId: this.message.key,
        senderId: this.userProfile.uid,
        receiverId: this.selectedFriend.friendId,
      };
      this.firestore
        .addFilesToChat(dataForFiles, this.userProfile.key as string)
        .then(() => {
          this.firestore.filesSubject.unsubscribe();
          this.firestore
            .addFilesToChat(dataForFiles, selectedFriend?.key as string)
            .then(() => {
              this.firestore.filesSubject = new Subject();
              this.filesArr = [];
            });
        });
    }
    this.sendMessNotifications();
  }

  deleteMessage(message: Chat) {
    this.base.deleteMessage(message).then(() => {
      this.urlText = [];
      this.allChatsArray = this.allChatsArray.filter(
        mess => mess.key !== message.key
      );
      this.getVisibleMessagesForSelectedFriend();
    });
  }

  sendMessNotifications() {
    const apiUrl = 'https://us-central1-project0781.cloudfunctions.net/api/';
    let friend = this.userProfiles.find(
      uP => uP.uid === this.selectedFriend.friendId
    );

    const msg: Notification = {
      displayName: this.message.message.displayName,
      message: this.message.message.message,
      profilePhoto: this.message.message.profilePhoto,
      timeStamp: this.message.message.timeStamp,
    };

    new Promise((res, rej) => {
      this.firestore.getUserNotiSubscription(friend!.key).subscribe(sub => {
        this.friendPushSub = sub;
        if (this.friendPushSub !== undefined) {
          res(this.friendPushSub);
        }
      });
    }).then(pushSub => {
      this.http
        .post(apiUrl + 'message', { msg: msg, sub: pushSub })
        .subscribe(res => console.log(res));
    });
  }

  backToUsers() {
    this.sendPrivateMessageOn = false;
    this.userMessages = false;
    this.isMessageOn = false;
    this.firestore.filesSubject.unsubscribe();
    this.filesArr = [];
    this.firestore.filesSubject = new Subject();
    this.urlText = [];
  }

  calcMinutesPassed(sentMessDate: any) {
    const newDate = new Date().getTime();
    sentMessDate = new Date(sentMessDate).getTime();
    // A különbség milliszekundumokban
    const diffMilliseconds = newDate - sentMessDate;
    // A különbség percekben
    const passedMinsSMessSent = Math.floor(diffMilliseconds / 1000 / 60);
    let hours: number = 0;
    for (let i = 60; i < passedMinsSMessSent && i <= 1440; i += 60) {
      hours += 1;
    }

    let days: number = 0;
    for (
      let i = 1440;
      passedMinsSMessSent >= 1440 && i <= passedMinsSMessSent;
      i += 1440
    ) {
      days += 1;
    }

    if (passedMinsSMessSent < 60)
      return `${passedMinsSMessSent} perccel ezelőtt`;

    if (hours < 24) return `${hours} órával ezelőtt`;

    if (hours >= 24) return `${days} nappal ezelőtt`;
  }

  runMessagesSubjectValueTransfer() {
    this.base.getAllMessagesSubject.next({
      haventSeenMessagesArr: this.haventSeenMessagesArr,
      allChatsArray: this.allChatsArray,
      showFriendsMess: this.showFriendsMess,
    });
  }

  /**
   * subject és a next értékének egymás utáni sorrendben kell lenni
   * ha több subject-et adsz át a funkciónak
   * @param {any} nextValue - Next értéke.
   * @param {Subject} subject - Választott subject.
   * @param {number} nextValuesArr - Nextértékek tömb
   * @param {number} subjectsArr - Subjects tömb
   */
  subjectValueTransfer(
    nextValue: any,
    subject: Subject<any> | BehaviorSubject<any>,
    nextValuesArr?: any[],
    ...subjectsArr: Subject<any>[] | BehaviorSubject<any>[]
  ) {
    if (subject) subject.next(nextValue);
    if (subjectsArr.length && nextValuesArr?.length) {
      subjectsArr.forEach((sub, i) => sub.next(nextValuesArr[i]));
    }
  }

  randomIdGenerator() {
    const idString = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let chatId = 'chat_id_';
    let friendId = 'friend_id_';
    for (let i = 0; i <= 4; i++) {
      if (this.message.message.timeStamp) {
        chatId += idString.charAt(Math.round(Math.random() * 30));
      } else {
        friendId += idString.charAt(Math.round(Math.random() * 30));
      }
    }
    if (this.message.message.timeStamp) return '_' + chatId;
    else return friendId;
  }

  fileModalOpen(picturesArr: [], i: number) {
    const modalRef = this.ngbModal.open(FilesModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.picturesArr = picturesArr;
    modalRef.componentInstance.viewIndex = i;
  }

  /////////////////////// LEÍRÁS //////////////////////////////
  // A ShowFriendsMessArr tömb értékeit állítja be //
  // új üzenetnél és mikor elolvassuk az üzenetet //
  filterShowFriendsMessArr() {
    // a nemlátott üzenetek tömböt iterálja, kiszűri a baráttól való
    // eddig nem láttott üzeneteket és kap egy
    // seen:false property-t + az adott barát összes többi tulajdonságát
    const messSenderIds = this.haventSeenMessagesArr?.map(
      mess => mess?.message?.senderId
    );
    // const friendNewMessageFrom: any = this.haventSeenMessagesArr?.flatMap(
    //   mess => {
    //     return this.userFriends
    //       // ?.filter(fr => fr.friendId === mess.message.senderId)
    //       ?.filter(fr => prob?.includes(fr.friendId))
    //       .map(fr => ({ ...fr, seen: false }));
    //   }
    // );
    const friendNewMessageFrom: any = this.userFriends
      ?.filter(fr => messSenderIds?.includes(fr.friendId))
      .map(fr => ({ ...fr, seen: false }));
    const allFriendsAndNMessFromArr = [
      ...friendNewMessageFrom,
      ...(this.userFriends || ''),
    ];
    // objektum ami segít kiszűrni a duplikációkat a tömbből
    const seenFriendIds: any = {};
    const filteredFriendsArr = allFriendsAndNMessFromArr.filter((fr, i) => {
      // Ha ez az első alkalom, hogy találkozunk ezzel a friendId-val, akkor visszatérünk igazzal, hogy a barát objektumot a szűrt tömbbe tegyük
      if (!seenFriendIds[fr.friendId]) {
        seenFriendIds[fr.friendId] = true;
        return true;
      }
      return false;
    });

    this.showFriendsMess = filteredFriendsArr;
  }

  getNewPostsNotification() {
    this.postsNotiSub = this.firestore.postsNotiSubject.subscribe(num => {
      if (num === 0) this.postsNotificationNumber = num;
      if (num > 0) {
        this.postsNotificationNumber = num;
      }
    });
  }

  getNotSeenMyPostsNotification() {
    this.firestore.getMyPostsNotiSubj().subscribe(num => {
      this.myPostsNotificationNumber = num === 0 || num > 0 ? num : 0;
    });
  }

  toFriendProfile(friendId: string) {
    const userProfile = this.userProfile;
    console.log(userProfile);
    const promise = new Promise((res, rej) => {
      const friendProfile = this.userProfiles.find(uP => {
        return uP.uid === friendId;
      });
      // send friendprofilekey with subj
      this.base.userKeySubject.next(friendProfile?.key);
      if (friendProfile?.friends) {
        const friendsArrIterable = [...Object.entries(friendProfile!.friends)];
        const friendsArr: any = friendsArrIterable.flat();

        const friendsArray = [];
        let obj: any = {};
        for (let i = 0; i < friendsArr.length; i++) {
          if (typeof friendsArr[i] === 'string') {
            obj.key = friendsArr[i];
          } else {
            obj.friendId = friendsArr[i].friendId;
            friendsArray.push(obj);
            obj = {};
          }
        }

        const user: any = friendsArray.find(
          (f: any) => f.friendId === userProfile.uid
        );
        if (user) user.seenMe = true;
        this.base
          .updateFriend(user.key, { seenMe: user.seenMe } as any)
          .then(() => {
            this.base.userProfilesSubject.next(this.userProfiles);
            this.base.friendProfileSubject.next(friendProfile);
            res('');
          });
      } else {
        this.base.friendProfileSubject.next(friendProfile);
        res('');
      }
    });

    promise.then(() =>
      this.router.navigate(['/' + friendId + '/friend-profile'])
    );
  }

  areFriendsOnline() {
    setTimeout(() => {
      this.onAnimate();
    }, 100);
    const interval = setInterval(() => {
      this.userFriends?.map(fr => {
        return this.userProfiles.map(uP => {
          if (uP.uid === fr.friendId) {
            fr.online = uP.online;
            fr.lastTimeOnline = this.calcMinutesPassed(uP.lastTimeOnline);
          }
        });
      });
      clearInterval(interval);
    }, 1000);
  }

  refreshMyPosts() {
    this.firestore
      .refreshMyPosts(this.userProfile?.key)
      .subscribe((myPosts: any[]) => {
        myPosts.map(myPost => {
          if (
            myPost.seen === false &&
            !this.seenMyPosts.includes(myPost.fromPostId)
          ) {
            console.log(myPost);
            this.seenMyPosts.push(myPost.fromPostId);
            this.firestore.getMyPostsNotiSubj().next(this.seenMyPosts.length);
          }
        });
      });
  }

  getMyPostsCounter = -1;
  getSharedPostsCounter = -1;
  getPosts: {
    isGetMyPosts: boolean;
    isGetSharedPosts: boolean;
  } = {
    isGetMyPosts: false,
    isGetSharedPosts: false,
  };
  getMyPosts() {
    if (this.getMyPostsCounter === -1) return this.getMyPostsCounter++;
    if (!this.getMyPostsCounter) {
      this.getPosts.isGetMyPosts = false;
      this.firestore.getMyPostsSub().next(this.getPosts);
      this.getMyPostsCounter = 1;
    } else if (this.getMyPostsCounter) {
      this.getPosts.isGetMyPosts = true;
      this.firestore.getMyPostsSub().next(this.getPosts);
      this.getMyPostsCounter = 0;
    }
  }

  getSharedPosts() {
    if (this.getSharedPostsCounter === -1) return this.getSharedPostsCounter++;
    if (!this.getSharedPostsCounter) {
      this.getPosts.isGetSharedPosts = false;
      this.firestore.getMyPostsSub().next(this.getPosts);
      this.getSharedPostsCounter = 1;
    } else if (this.getSharedPostsCounter) {
      this.getPosts.isGetSharedPosts = true;
      this.firestore.getMyPostsSub().next(this.getPosts);
      this.getSharedPostsCounter = 0;
    }
  }

  refreshSharedPosts() {
    this.firestore.refreshSharedPosts().subscribe((sPosts: any[]) => {
      sPosts.map(sPost => {
        if (
          sPost.notSeen?.includes(this.userProfile?.uid) &&
          !this.seenPosts.includes(sPost.timeStamp)
        ) {
          this.seenPosts.push(sPost.timeStamp);
          this.firestore.postsNotiSubject.next(this.seenPosts.length);
        }
      });
    });
  }

  toAlbum() {
    this.base.userProfileSubject.next(this.userProfile);
    this.router.navigate(['/album/' + this.userProfile.uid]);
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
    if (this.getAllMessagesSubjectSub) {
      this.getAllMessagesSubjectSub.unsubscribe();
    }
    if (this.haventSeenMsgsArrSubjSub) {
      this.getAllMessagesSubjectSub.unsubscribe();
    }
    if (this.userFriendSubjectSub) {
      this.userFriendSubjectSub.unsubscribe();
    }
    if (this.filesBehSubjectSub) {
      this.filesBehSubjectSub.unsubscribe();
    }
    if (this.messSubscription) {
      this.messSubscription.unsubscribe();
    }
    if (this.postsNotiSub) {
      this.postsNotiSub.unsubscribe();
    }
  }
}
