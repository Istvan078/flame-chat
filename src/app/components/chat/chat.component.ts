import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Chat } from 'src/app/models/chat.model';
import { ForUserSubject, Friends, UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { MatAccordion } from '@angular/material/expansion';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modals/modal/modal.component';
import { FirestoreService } from 'src/app/services/firestore.service';
import { HttpClient } from '@angular/common/http';
import { ToastService } from 'src/app/services/toast.service';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { UtilityService } from 'src/app/services/utility.service';

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
  ],
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild(MatAccordion) accordion!: MatAccordion;
  @ViewChild('slideToggle') slideToggle!: MatSlideToggle;

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
  isSAdmin: boolean = false;
  isUserProfileOn: boolean = false;
  showFriendsToChoose: boolean = false;
  friendsOn: boolean = false;
  isUserOnlineNow: boolean = false;

  // KERESÉS //
  userSearched: string = '';
  userSearchedProfiles: UserClass[] & Friends[] = [];

  // ÜZENETEKKEL KAPCSOLATOS //
  messageButtonClicked: boolean = false;
  arePostsOn: boolean = false;
  areMyPostsOn: boolean = false;
  subscribedForNotifications: boolean = false;
  haventSeenMessagesArr: any[] = [];

  // POSZTOKKAL KAPCSOLATOS //
  postsNotificationNumber: number = 0;
  myPostsNotificationNumber: number = 0;
  seenPosts: any[] = [];
  seenMyPosts: any[] = [];
  getMyPostsCounter = -1;
  getSharedPostsCounter = -1;
  getPosts: {
    isGetMyPosts: boolean;
    isGetSharedPosts: boolean;
  } = {
    isGetMyPosts: false,
    isGetSharedPosts: false,
  };

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
  postsNotiSub: Subscription = Subscription.EMPTY;
  isSubscribedForNotSub: Subscription = Subscription.EMPTY;
  getFriendsSub: Subscription = Subscription.EMPTY;
  userSubjectSub: Subscription = Subscription.EMPTY;
  allUserDetailsSub: Subscription = Subscription.EMPTY;
  getFriendsFromUtilSub!: Subscription;
  seenMeSub!: Subscription;
  getMyPostsSub: Subscription = Subscription.EMPTY;
  refreshMyPostsSub: Subscription = Subscription.EMPTY;
  messSubscription: Subscription = Subscription.EMPTY;

  onAnimate() {
    this.chatAnimationState =
      this.chatAnimationState === 'normal' ? 'in-2' : 'normal';
  }

  constructor(
    private auth: AuthService,
    private base: BaseService,
    private router: Router,
    private ngbModal: NgbModal,
    private firestore: FirestoreService,
    private toastService: ToastService,
    private utilService: UtilityService
  ) {}
  async ngOnInit() {
    this.auth.authNullSubject.subscribe(authNull => {
      this.authNull = authNull;
    });

    this.userSubjectSub = this.utilService.userSubject.subscribe(user => {
      if (user.userProfiles) this.userProfiles = user.userProfiles;
      if (user.userProfile) {
        this.userProfile = user.userProfile;
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
    this.getAllMessagesSubjectSub = this.base.getAllMessagesSubject.subscribe(
      obj => {
        if (obj.haventSeenMessagesArr) {
          this.haventSeenMessagesArr = obj.haventSeenMessagesArr;
        }
      }
    );

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
                    this.utilService.subjectValueTransfer(
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
      // baratok listajanak lekerese
      if (!this.userProfile?.uid) return;
      if (this.userProfile?.uid) {
        this.getFriendsSub = this.getFriendsAndNotFriends().subscribe({
          next: (res: any) => {
            console.log(res);
            this.getNumberOfNewMessages();
            setTimeout(() => {
              console.log(this.haventSeenMessagesArr);
              this.base.getAllMessagesSubject.next({
                haventSeenMessagesArr: this.haventSeenMessagesArr,
              });
            }, 2000);
          },
          complete: async () => {
            console.log('***OBSERVABLE BEFEJEZŐDÖTT***');
            await this.base.updateUserData(
              { online: true },
              this.userProfile?.key
            );
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
              if (!this.seenMeSub)
                this.seenMeSub = this.utilService
                  .getFriendsForNotifUpdate()
                  .subscribe(seenMeArr => {
                    this.utilService.subjectValueTransfer(
                      seenMeArr,
                      this.base.profileSeenSubject
                    );
                    observer.complete();
                  });
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
        this.utilService.subjectValueTransfer(
          this.utilService.forUserSubject,
          this.utilService.userSubject
        );
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
    this.utilService.subjectValueTransfer(
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
        this.utilService.subjectValueTransfer(
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

  deleteUserData(id: any) {
    const toDeleteProfiles = this.userProfiles.filter(uP => {
      return uP.uid === 'NRQ2kFyKrpN1rTSRJ0gcna1DzdK2';
    });
    toDeleteProfiles.map(prof => {
      this.base.deleteUserData(prof.key);
    });
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

  getNumberOfNewMessages() {
    this.messSubscription = this.base.getNewMessages().subscribe(msgs => {
      if (msgs.length)
        this.haventSeenMessagesArr = msgs.filter(
          msg =>
            !msg.message.seen &&
            msg.messsage?.senderId !== this.userProfile.uid &&
            msg.participants[1] === this.userProfile.uid
        );
      this.utilService.subjectValueTransfer(
        this.haventSeenMessagesArr,
        this.base.newMessageNotiSubject
      );
      console.log(`GETNUMBEROFNEWMESSAGES`);
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

  searchUser() {
    this.userSearchedProfiles = (this.userProfiles as any).filter((uP: any) =>
      uP.displayName?.toLowerCase().includes(this.userSearched)
    );
    if (!this.userSearched) this.userSearchedProfiles = [];
  }

  setVisibilityOn() {
    this.userProfile.visibility = true;
    this.base.updateUserData(
      { visibility: this.userProfile.visibility },
      this.userProfile.key
    );
  }
  setVisibilityOff() {
    this.userProfile.visibility = false;
    this.base.updateUserData(
      { visibility: this.userProfile.visibility },
      this.userProfile.key
    );
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
    if (this.userFriendSubjectSub) {
      this.userFriendSubjectSub.unsubscribe();
    }
    if (this.postsNotiSub) {
      this.postsNotiSub.unsubscribe();
    }
    if (this.messSubscription) {
      this.messSubscription.unsubscribe();
    }
    if (this.getFriendsSub) this.getFriendsSub.unsubscribe();
    if (this.userSubjectSub) this.userSubjectSub.unsubscribe();
    if (this.allUserDetailsSub) this.allUserDetailsSub.unsubscribe();
    if (this.getFriendsFromUtilSub) this.getFriendsFromUtilSub.unsubscribe();
    if (this.seenMeSub) this.seenMeSub.unsubscribe();
    if (this.getMyPostsSub) this.getMyPostsSub.unsubscribe();
    if (this.refreshMyPostsSub) this.refreshMyPostsSub.unsubscribe();
  }
}
