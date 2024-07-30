import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { Chat } from 'src/app/models/chat.model';
import { ForUserSubject, Friends, UserClass } from 'src/app/models/user.model';
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
import { UtilityService } from 'src/app/services/utility.service';

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
  @ViewChild('messageCardCont') messageCardCont!: ElementRef;

  // ANIMÁCIÓVAL KAPCSOLATOS //
  chatAnimationState: string = 'normal';

  // FELHASZNÁLÓVAL KAPCSOLATOS //
  userProfiles: UserClass[] = [];
  userNotFriends: any[] = [];
  userFriends?: Friends[] = [];
  notConfirmedMeUsers: UserClass[] = [];
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
  notConfirmedSignedAsFriend: boolean = false;

  // SUBJECTHEZ //
  authNull = 2;
  forUserSubject: ForUserSubject = new ForUserSubject();

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
  getFriendsSub: Subscription = Subscription.EMPTY;
  userSubjectSub: Subscription = Subscription.EMPTY;
  allUserDetailsSub: Subscription = Subscription.EMPTY;
  getFriendsFromUtilSub!: Subscription;
  seenMeSub!: Subscription;
  getMyPostsSub: Subscription = Subscription.EMPTY;
  refreshMyPostsSub: Subscription = Subscription.EMPTY;

  // ESEMÉNYFIGYELŐK //
  private isOnlineHandler: () => void;
  private isOfflineHandler: () => void;

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
      subscriber.next({ message: 'új érték' }); // itt azt állítjuk be MIKOR történjen meg a next esemény!!!
    }, 2000);
  });

  onAnimate() {
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
    private toastService: ToastService,
    private utilService: UtilityService,
    private element: ElementRef
  ) {
    this.isOnlineHandler = this.handleOnline.bind(this);
    this.isOfflineHandler = this.handleOffline.bind(this);
  }
  ngOnInit() {
    this.isUserOnline();
    this.test();
    this.auth.authNullSubject.subscribe(authNull => {
      this.authNull = authNull;
    });
    this.getAllMessagesSubjectSub = this.base.getAllMessagesSubject.subscribe(
      obj => {
        if (obj.allChatsArray) this.allChatsArray = obj.allChatsArray;
        if (obj.showFriendsMess) this.showFriendsMess = obj.showFriendsMess;
        if (obj.haventSeenMessagesArr)
          this.haventSeenMessagesArr = obj.haventSeenMessagesArr;
      }
    );
    this.haventSeenMsgsArrSubjSub = this.base.haventSeenMsgsArr.subscribe(
      hSMArr => {
        this.haventSeenMessagesArr = hSMArr;
      }
    );

    this.userSubjectSub = this.utilService.userSubject.subscribe(user => {
      if (user.userProfiles) this.userProfiles = user.userProfiles;
      if (user.userProfile) {
        this.userProfile = user.userProfile;
        // if (!this.userProfile.displayName) {
        //   this.router.navigate([`/profile/${this.userProfile.uid}`]);
        // }
      }
      if (user.userNotFriends) this.userNotFriends = user.userNotFriends;
      if (user.userFriends) this.userFriends = user.userFriends;
      if (user.notConfirmedMeUsers)
        this.notConfirmedMeUsers = user.notConfirmedMeUsers;
      if (user.subscription) user.subscription.unsubscribe();
      if (!this.notConfirmedMeUsers.length) this.confirmFriend();
      if (this.notConfirmedMeUsers.length || this.userNotFriends.length)
        this.friendsOn = true;
    });
    new Promise(res => {
      this.userLoggedInSubscription = this.auth
        .getUserLoggedInSubject()
        .subscribe(async (user: any) => {
          // felhasznaloi adatok lekerese
          if (
            (Object.keys(this.utilService.userSubject.getValue()).length ===
              0 &&
              !this.userProfiles.length) ||
            this.authNull === null
          )
            if (user.uid) {
              console.log(this.userProfiles);
              const profsObs = await this.utilService.getUserProfiles();
              this.allUserDetailsSub = profsObs.subscribe(
                (allUserDetails: any) => {
                  this.userProfiles = allUserDetails.userProfiles;
                  this.userProfile = allUserDetails.userProfile;
                  this.utilService.forUserSubject.userProfile =
                    this.userProfile;
                  this.utilService.forUserSubject.userProfiles =
                    this.userProfiles;

                  if (this.userProfile && !this.userProfile.birthDate) {
                    this.router.navigate(['/profile/' + user.uid]);
                  }
                  if (
                    (this.userProfile?.key &&
                      !Object.keys(this.utilService.userSubject.getValue())
                        .length) ||
                    this.authNull === null
                  ) {
                    this.subjectValueTransfer(
                      this.utilService.forUserSubject,
                      this.utilService.userSubject
                    );
                    this.getMyPostsSub = this.getMyPostsSubcription();
                    this.refreshMyPostsSub = this.refreshMyPosts();
                    this.getNewPostsNotification();
                    this.getNotSeenMyPostsNotification();
                    res('**** SIKERES FELHASZNÁLÓI PROFIL LEKÉRÉS ****');
                  }
                }
              );
            }
          if (this.userProfile.key && this.authNull !== null) {
            console.log(`Lefutott`);
            this.getMyPostsSub = this.getMyPostsSubcription();
            this.refreshMyPostsSub = this.refreshMyPosts();
            this.getNewPostsNotification();
            this.getNotSeenMyPostsNotification();
            res('**** SIKERES FELHASZNÁLÓI PROFIL LEKÉRÉS ****');
          }
        });
    }).then(res => {
      if (this.userProfile.displayName)
        this.isSubscribedForNotSub = this.isSubscribedForNotifications()!;
      if (this.isSubscribedForNotSub) this.isSubscribedForNotSub.unsubscribe();
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
        this.getFriendsSub = this.getFriendsAndNotFriends().subscribe({
          next: (res: any) => {
            console.log(res);
            // új üzenetek lekérése
            this.messSubscription = this.getNewMessages();
          },
          complete: () => {
            console.log('***OBSERVABLE BEFEJEZŐDÖTT***');
            this.auth.authNullSubject.next(2);
            if (this.getFriendsSub) this.getFriendsSub.unsubscribe();
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
      if (this.userProfile.uid)
        if (!this.getFriendsFromUtilSub)
          this.getFriendsFromUtilSub = this.utilService
            .getFriends()
            .subscribe(val => {
              observer.next('**** SIKERES BARÁTOK LISTÁJA LEKÉRÉS ****');
            });
      if (!this.seenMeSub)
        this.seenMeSub = this.utilService
          .getFriendsForNotifUpdate()
          .subscribe(seenMeArr => {
            this.subjectValueTransfer(seenMeArr, this.base.profileSeenSubject);
            observer.complete();
          });
      setTimeout(() => {
        console.log(`TIMEOUT MEGJAVÍTANI`);
        this.setDefaultProfilePic();
      }, 5000);
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
          if (
            !this.userProfile.pushNotificationsOn ||
            this.userProfile.pushNotificationsOn === true
          ) {
            this.base.updateUserData(
              { pushNotificationsOn: 'off' },
              this.userProfile.key
            );
          }
        }
      } catch (err) {
        this.slideToggle.checked = true;
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
          if (docs.empty && isSubscribed && !wantsToUnsub) {
            this.base.updateUserData(
              { pushNotificationsOn: true },
              this.userProfile.key
            );
            this.firestore.saveUserNotiSubscription(
              this.userProfile.key,
              JSONed
            );
          }
          docs.forEach(async doc => {
            if (doc.exists && !isSubscribed && wantsToUnsub) {
              await this.firestore.deleteUserNotificationSub(
                this.userProfile.key,
                doc.id
              );
              this.myPushSubscription.unsubscribe();
            }

            if (!doc.exists && isSubscribed && !wantsToUnsub) {
              this.base.updateUserData(
                { pushNotificationsOn: true },
                this.userProfile.key
              );
              this.firestore.saveUserNotiSubscription(
                this.userProfile.key,
                JSONed
              );
            }
          });
        });
    }
  }

  signAsAFriend(user: Friends) {
    console.log(user);
    const friend: {} = {
      friendId: user.friendId,
      friendKey: user.friendKey,
      confirmed: false,
    };
    this.base
      .addFriends(friend, user.friendKey!, this.userProfile.key)
      ?.then(() => {
        const modalRef = this.ngbModal.open(ModalComponent, {
          centered: true,
          animation: true,
        });
        modalRef.componentInstance.friendName = user.displayName;
        this.toastVal = user;
        modalRef.componentInstance.name = 'Ismerősnek jelölve.';
        this.userNotFriends = this.userNotFriends.filter(
          nFr => nFr.friendKey !== user.friendKey
        );
        this.utilService.forUserSubject.userNotFriends = this.userNotFriends;
        this.subjectValueTransfer(
          this.utilService.forUserSubject,
          this.utilService.userSubject
        );
        this.filterShowFriendsMessArr();
        this.base.getAllMessagesSubject.next({
          showFriendsMess: this.showFriendsMess,
        });
      });
    const forSignedInFriendsProf = {
      friendId: this.userProfile.uid,
      friendKey: this.userProfile.key,
      areFriends: false,
    };
    this.base.updateFriendsFriend(
      user.friendKey!,
      this.userProfile.key,
      forSignedInFriendsProf
    );
  }

  async confirmedFriend(friend: string) {
    const friendProf = this.notConfirmedMeUsers.find(uP => {
      if (uP.displayName === friend) return uP.displayName === friend;
      if (uP.email === friend) return uP.email === friend;
    });
    await this.base.updateFriendsFriend(friendProf!.key, this.userProfile.key, {
      confirmed: true,
    } as any);
    await this.base.updateFriend(
      friendProf!.key,
      { areFriends: true } as any,
      this.userProfile.key
    );
    this.utilService.forUserSubject.notConfirmedMeUsers =
      this.notConfirmedMeUsers.filter(uP => {
        if (uP.displayName === friend) return uP.displayName !== friend;
        if (uP.email === friend) return uP.email !== friend;
      });
    this.subjectValueTransfer(
      this.utilService.forUserSubject,
      this.utilService.userSubject
    );
  }

  confirmFriend() {
    const promise = new Promise((res, rej) => {
      this.notConfirmedMeUsers = this.userProfiles.map((uP, i, arr) => {
        if (uP.friends) {
          const friendsArrIterable = [...Object.entries(uP.friends as any)];
          const friendsArr: any = friendsArrIterable.flat();
          const friendsArray = [];
          let obj: any = {};
          for (let i = 0; i < friendsArr.length; i++) {
            if (typeof friendsArr[i] === 'string') {
              obj.key = friendsArr[i];
            } else {
              obj.friendId = friendsArr[i].friendId;
              obj.confirmed = friendsArr[i].confirmed;
              friendsArray.push(obj);
              obj = {};
            }
          }
          ///////////// A USER ÉN VAGYOK ///////////////
          const user: any = friendsArray.find(
            (f: any) => f.friendId === this.userProfile.uid
          );
          if (user?.confirmed === false) return uP;
        } else {
          return undefined as any;
        }
      });
      this.notConfirmedMeUsers = this.notConfirmedMeUsers.filter(uP => uP);
      if (this.notConfirmedMeUsers.length)
        this.notConfirmedMeUsers.map(uP => {
          this.toastService.addToast(
            uP.displayName ? uP.displayName : uP.email!,
            'Ismerősnek jelölt téged',
            {
              autohide: false,
            }
          );
        });
      this.utilService.forUserSubject.notConfirmedMeUsers =
        this.notConfirmedMeUsers;
      this.utilService.forUserSubject.userFriends = this.userFriends!;
      this.utilService.forUserSubject.userNotFriends = this.userNotFriends;
      if (this.notConfirmedMeUsers.length)
        this.subjectValueTransfer(
          this.utilService.forUserSubject,
          this.utilService.userSubject
        );
    });
  }

  async removeFriend(friend: any) {
    await this.base.removeFriendsFriend(friend.friendKey, this.userProfile.key);
    this.base.removeFriend(friend.friendKey, this.userProfile.key).then(() => {
      const modalRef = this.ngbModal.open(ModalComponent, {
        ariaLabelledBy: 'modal-basic-title',
        centered: true,
      });
      modalRef.componentInstance.name = 'Törölve az ismerősök közül.';
      if (this.toastVal.uid == friend.friendId) {
        modalRef.componentInstance.friendName = this.toastVal.displayName;
      }
      this.filterShowFriendsMessArr();
      this.base.getAllMessagesSubject.next({
        showFriendsMess: this.showFriendsMess,
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
      }, 200);
      setTimeout(async () => {
        let JSONed = this.myPushSubscription?.toJSON();
        if (
          JSONed?.endpoint &&
          this.userProfile.pushNotificationsOn !== false
        ) {
          const querySnapShot =
            await this.firestore.getUserNotiSubscriptionReformed(
              this.userProfile?.key,
              JSONed.endpoint
            );
          if (querySnapShot.empty) {
            console.log('NINCS ILYEN FELIRATKOZÁS MÉG');
            const doYouSubscribeModal = this.ngbModal.open(ModalComponent, {
              animation: true,
              fullscreen: true,
            });
            doYouSubscribeModal.componentInstance.isSubscribedToNotif = false;

            try {
              const choiceResult = await doYouSubscribeModal.result;
              if (choiceResult === 'Igen') {
                await this.updateUserNotifications({ checked: true });
                this.subscribedForNotifications = true;
                if (!this.userProfile.pushNotificationsOn) {
                  this.base.updateUserData(
                    { pushNotificationsOn: true },
                    this.userProfile.key
                  );
                }
              }
            } catch (err) {
              if (err) {
                this.base.updateUserData(
                  { pushNotificationsOn: false },
                  this.userProfile.key
                );
              }
            }
          }
          if (JSONed.endpoint) observer.complete();
        } else if (!this.isSAdmin && !JSONed?.endpoint) {
          console.log('LE VAN TILTVA AZ ÉRTESÍTÉSEK A BÖNGÉSZŐBEN');
          const doYouSubscribeModal = this.ngbModal.open(ModalComponent, {
            animation: true,
            fullscreen: true,
          });
          doYouSubscribeModal.componentInstance.isSubscribedToNotif = false;
          const choiceResult = await doYouSubscribeModal.result;
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
    if (this.userProfile.uid)
      this.router.navigate([`profile/${this.userProfile.uid}`]);
  }

  getMessageUser(user: any) {
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
      console.log(this.showFriendsMess);
      // Üzenetek a kiválasztott baráttól tömb iteráció
      this.visibleMessages.map(mess => {
        //////////////// LEÍRÁS  ////////////////////////
        // Ha van új üzenet és ez a legelső üzenet a baráttól, akkor frissítsük
        // az adatbázisban a baráttal való messaging tulajdonságot true értékre.
        if (mess.message.seen === false) {
          if (user.messaging === undefined) {
            const startMessaging = { messaging: true };
            this.base
              .updateFriend(
                user.friendKey,
                startMessaging as any,
                this.userProfile.key
              )
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
    this.visibleMessages = selectedFriendMessages.slice(0, 15);
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
  async firstMessageToFriend(mess: any) {
    const startMessaging = { messaging: true };
    await this.base.updateFriend(
      mess.friendKey as string,
      startMessaging as any,
      this.userProfile.key
    );
    this.showFriendsToChoose = false;
    mess.messaging = true;
    setTimeout(() => {
      const messageCardElements = this.element.nativeElement.querySelectorAll(
        '.messageCardCont div h2'
      );
      // const showAllFriendsCont = this.element.nativeElement.querySelector(
      //   '.showAllFriendsCont'
      // );

      messageCardElements.forEach((el: any) => {
        if (mess.displayName === el.innerText) {
          console.log(el);
          const container = el.parentNode.parentNode;
          window.scrollTo(
            el.getBoundingClientRect().x,
            el.getBoundingClientRect().y
            // showAllFriendsCont.getBoundingClientRect().height
          );
          if (mess.messaging) {
            container.classList.add('hidden');
            console.log(container.classList.contains('hidden'));
            setTimeout(() => {
              container.classList.remove('hidden');
              container.classList.add('fade-in');
              container.style.backgroundColor = 'darkGreen';
              console.log(container.classList.contains('fade-in'));
            }, 50);
          }
        }
      });
    }, 5);
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
        if (!user?.key) {
          this.notConfirmedSignedAsFriend = true;
          if (this.toastService.toasts.length) this.toastService.toasts = [];
          this.toastService.addToast(
            'A FELHASZNÁLÓ MÉG NEM IGAZOLTA VISSZA ISMERŐSNEK JELÖLÉSED',
            ''
          );
        }
        if (user?.key)
          this.base
            .updateFriend(
              user.key,
              { seenMe: user.seenMe } as any,
              friendProfile.key
            )
            .then(() => {
              this.base.userProfilesSubject.next(this.userProfiles);
              this.base.friendProfileSubject.next(friendProfile);
              res('');
            });
      } else {
        this.notConfirmedSignedAsFriend = true;
        if (this.toastService.toasts.length) this.toastService.toasts = [];
        this.toastService.addToast(
          'A FELHASZNÁLÓ MÉG NEM IGAZOLTA VISSZA ISMERŐSNEK JELÖLÉSED',
          ''
        );
        this.base.friendProfileSubject.next(friendProfile);
        res('');
      }
    });

    promise.then(() => {
      if (this.userProfile.uid)
        this.router.navigate(['/' + friendId + '/friend-profile']);
    });
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
    return this.firestore
      .refreshMyPosts(this.userProfile?.key)
      .subscribe((myPosts: any[]) => {
        myPosts.map(myPost => {
          if (!this.seenMyPosts.includes(myPost.fromPostId)) {
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

  getMyPostsSubcription() {
    return this.firestore
      .refreshSharedWithMePosts()
      .subscribe((sPosts: any[]) => {
        console.log(sPosts);
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

  toAlbum() {
    this.base.userProfileSubject.next(this.userProfile);
    this.router.navigate(['/album/' + this.userProfile.uid]);
  }

  async handleOnline() {
    if (!this.isUserOnlineNow) {
      await this.base.updateUserData({ online: true }, this.userProfile?.key);
      this.isUserOnlineNow = true;
    }
  }

  async handleOffline() {
    if (this.isUserOnlineNow) {
      await this.base.updateUserData({ online: false }, this.userProfile?.key);
      await this.base.updateUserData(
        { lastTimeOnline: new Date().getTime() },
        this.userProfile?.key
      );
      this.isUserOnlineNow = false;
    }
  }

  async isUserOnline() {
    // A FELHASZNÁLÓ ONLINE-E ESEMÉNYFIGYELŐK //
    window.addEventListener('click', this.isOnlineHandler);
    window.addEventListener('focus', this.isOnlineHandler);
    // A FELHASZNÁLÓ OFFLINE-E ESEMÉNYFIGYELŐ //
    window.addEventListener('blur', this.isOfflineHandler);
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
    if (this.getFriendsSub) this.getFriendsSub.unsubscribe();
    if (this.userSubjectSub) this.userSubjectSub.unsubscribe();
    if (this.allUserDetailsSub) this.allUserDetailsSub.unsubscribe();
    if (this.getFriendsFromUtilSub) this.getFriendsFromUtilSub.unsubscribe();
    if (this.seenMeSub) this.seenMeSub.unsubscribe();
    if (this.getMyPostsSub) this.getMyPostsSub.unsubscribe();
    if (this.refreshMyPostsSub) this.refreshMyPostsSub.unsubscribe();
    window.removeEventListener('click', this.isOnlineHandler);
    window.removeEventListener('focus', this.isOnlineHandler);
    window.removeEventListener('blur', this.isOfflineHandler);
  }
}
