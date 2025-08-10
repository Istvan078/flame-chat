import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Friends, UserClass } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { UtilityService } from 'src/app/services/utility.service';

@Component({
  selector: 'app-messaged-friends',
  templateUrl: './messaged-friends.component.html',
  styleUrl: './messaged-friends.component.scss',
  animations: [
    trigger('slide-in-keyframed', [
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
          1200,
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
              transform: 'scale(1)',
              opacity: 1,
              offset: 1,
            }),
          ])
        ),
      ]),
    ]),
  ],
})
export class MessagedFriendsComponent implements OnInit, OnDestroy {
  @ViewChild('messageCardCont') messageCardCont!: ElementRef;

  chatAnimationState: string = 'normal';
  showFriendsToChoose: boolean = false;

  // ISMERŐS KERESÉSE //
  friendSearch: string = '';

  // FELHASZNÁLÓ //
  userProfiles: UserClass[] = [];
  userProfile: UserClass = new UserClass();
  showFriendsMess: any[] = [];
  showFriendsMessCopy: any[] = [];
  showAllFriends: boolean = false;
  isShowArchMsgs: boolean = false;
  userFriends?: Friends[] = [];
  archivedFriends: any[] = [];

  selectedFriend: any = {};

  // SZÁMLÁLÓK
  profSubCounter: number = 0;

  // ÜZENETEKKEL KAPCSOLATOS //
  haventSeenMessagesArr?: any[] = [];
  sendPrivateMessageOn: boolean = false;
  userMessages: boolean = false;
  isMessageOn: boolean = false;
  isMessMenu: boolean = false;
  isRemoveFrFromShowFriendsMess: boolean = false;
  allChatsArray: any[] = [];
  messagesAccordionTabCounter: number = 0;
  lastMsgsWithFriends: any[] = [];

  // FELIRATKOZÁSOK //
  userProfilesSub!: Subscription;
  getAllMessagesSubjectSub: Subscription = Subscription.EMPTY;
  haventSeenMsgsArrSubjSub: Subscription = Subscription.EMPTY;
  messSubscription: Subscription = Subscription.EMPTY;
  getNewMessSub: Subscription = Subscription.EMPTY;

  constructor(
    private base: BaseService,
    private utilService: UtilityService,
    private element: ElementRef,
    private router: Router
  ) {}
  async ngOnInit() {
    const AllUserDtlsRes = await this.utilService.getUserProfiles();
    this.userProfilesSub = AllUserDtlsRes.subscribe(async AllUserDtls => {
      if (this.profSubCounter === 0) {
        this.profSubCounter = 1;
        this.userProfiles = AllUserDtls.userProfiles;
        this.userProfile = AllUserDtls.userProfile;
        this.userFriends = AllUserDtls.userFriends!;
        console.log('ÖSSZES FELHASZNÁLÓ ADAT MEGÉRKEZETT A UTIL SERVICE-TŐL');
        this.getNewMessages();
        this.userFriends.map(fr => {
          if (fr?.messaging) {
            const msgsObs = this.base.getUserMessagesRefactored(
              this.userProfile.uid,
              fr.friendId,
              this.userProfile.key,
              fr.friendKey!,
              true
            );
            msgsObs.subscribe(async pr => {
              const lastMsgsArr = await pr;
              lastMsgsArr.sort(
                (a, b) => a?.message.timeStamp - b?.message.timeStamp
              );
              const lastMsgObj = lastMsgsArr[1];
              this.lastMsgsWithFriends.push(lastMsgObj);
            });
          }
        });

        await this.areFriendsOnline();
        this.archivedFriends = this.utilService.archivedFriends;
        this.onAnimate();
      }
      this.userProfilesSub.unsubscribe();
    });
    this.getAllMessagesSubjectSub = this.base.getAllMessagesSubject.subscribe(
      obj => {
        if (obj.allChatsArray) this.allChatsArray = obj.allChatsArray;
        if (obj.showFriendsMess) {
          this.showFriendsMess = obj.showFriendsMess;
          setTimeout(() => {
            console.log(`SHOWF LEFUTITT SUBJECTNÉL`);
            this.showFriendsMess = this.utilService.filterShowFriendsMessArr(
              this.haventSeenMessagesArr!,
              this.showFriendsMess
            );
          }, 1000);
        }
        // if (obj.haventSeenMessagesArr)
        //   this.haventSeenMessagesArr = obj.haventSeenMessagesArr;
      }
    );
    this.haventSeenMsgsArrSubjSub = this.base.haventSeenMsgsArr.subscribe(
      hsmArr => {
        this.haventSeenMessagesArr = hsmArr;
      }
    );
  }

  onAnimate() {
    this.chatAnimationState =
      this.chatAnimationState === 'normal' ? 'in-2' : 'normal';
  }

  archiveFriend(friend: any, userKey: string, i: number) {
    const body: any = friend?.newMessageNumber
      ? { archivedAftNewMess: true }
      : { archived: true };
    friend.archivedAftNewMess = friend?.newMessageNumber ? true : false;
    friend.archived = true;
    this.base.updateFriend(friend.friendKey, body, userKey);
  }
  openMainMenu? = () => {};
  openNotifications? = () => {};
  openProfile? = () => {};
  searchMessage() {
    if (!this.showFriendsMessCopy?.length)
      this.showFriendsMessCopy = this.showFriendsMess;
    if (this.friendSearch)
      return (this.showFriendsMess = this.showFriendsMess.filter(fr =>
        fr.displayName.toLowerCase().includes(this.friendSearch)
      ));
    if (!this.friendSearch)
      return (this.showFriendsMess = this.showFriendsMessCopy);
  }

  async deleteAllMsgsWithFriend(selectedFriendKey: string) {
    await this.base.deleteAllMsgsWithFriend(
      this.userProfile.key,
      selectedFriendKey
    );
    this.isRemoveFrFromShowFriendsMess = true;
    await this.base.updateFriend(
      selectedFriendKey,
      { messaging: false, archived: false } as any,
      this.userProfile.key
    );
    await this.base.updateFriendsFriend(
      selectedFriendKey,
      this.userProfile.key,
      {
        messaging: false,
        archived: false,
      }
    );
    this.showFriendsMess = this.showFriendsMess.filter(
      fr => fr.friendKey !== selectedFriendKey
    );
    this.isRemoveFrFromShowFriendsMess = false;
    console.log('Üzenetek a barattal törölve az adatbázisból.');
  }

  toArchivedMsgs() {
    this.isShowArchMsgs = true;
  }

  backToMsgs() {
    this.isShowArchMsgs = false;
  }
  cancelArcFriend(event: any) {
    this.showFriendsMess.push(event);
  }

  areFriendsOnline() {
    return new Promise(res => {
      if (this.messagesAccordionTabCounter < 2)
        this.messagesAccordionTabCounter++;
      const initInterval = setInterval(() => {
        const now = Date.now();
        const fiveMinsAgo = now - 5 * 60 * 1000;
        this.userFriends?.map(fr => {
          return this.userProfiles.map(uP => {
            if (uP.uid === fr.friendId) {
              if (uP.visibility) {
                if (uP?.lastTimeOnline)
                  fr.online =
                    uP.lastTimeOnline < fiveMinsAgo ? false : uP.online;
                fr.lastTimeOnline = this.utilService.calcMinutesPassed(
                  uP.lastTimeOnline
                );
                fr.visibility = true;
              }
            }
          });
        });
        const repeatingInterval = setInterval(() => {
          const now = Date.now();
          const fiveMinsAgo = now - 5 * 60 * 1000;
          this.userFriends?.map(fr => {
            return this.userProfiles.map(uP => {
              if (uP.uid === fr.friendId) {
                if (uP.visibility) {
                  if (uP?.lastTimeOnline)
                    fr.online =
                      uP.lastTimeOnline < fiveMinsAgo ? false : uP.online;
                  fr.lastTimeOnline = this.utilService.calcMinutesPassed(
                    uP.lastTimeOnline
                  );
                  fr.visibility = true;
                }
              }
            });
          });
          if (this.messagesAccordionTabCounter === 2) {
            this.messagesAccordionTabCounter = 1;
            res(clearInterval(repeatingInterval));
          }
        }, 60000);
        res(clearInterval(initInterval));
      }, 1000);
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

      messageCardElements.forEach((el: any) => {
        if (mess.displayName === el.innerText) {
          const container = el.parentNode.parentNode;
          window.scrollTo(
            el.getBoundingClientRect().x,
            el.getBoundingClientRect().y
          );
          if (mess.messaging) {
            container.classList.add('hidden');
            setTimeout(() => {
              container.classList.remove('hidden');
              container.classList.add('fade-in');
              container.style.backgroundColor = 'darkGreen';
            }, 50);
          }
        }
      });
    }, 5);
  }

  backToMainPage() {
    this.utilService.forUserSubject.userProfile = this.userProfile;
    this.utilService.forUserSubject.userProfiles = this.userProfiles;
    this.utilService.forUserSubject.userFriends = this.userFriends!;
    this.utilService.subjectValueTransfer(
      this.utilService.forUserSubject,
      this.utilService.userSubject
    );
    this.router.navigate(['/chat']);
  }

  async getMessageUser(user: any) {
    this.selectedFriend = user; // objektum
    this.sendPrivateMessageOn = true;
    this.userMessages = true;
    this.isMessageOn = true;
    if (user?.newMessageNumber) {
      let forNewMessNotiSub: any[] = this.base.newMessageNotiSubject.value;
      forNewMessNotiSub = forNewMessNotiSub.filter(
        msg => msg.friendId !== user.friendId
      );
      this.base.newMessageNotiSubject.next(forNewMessNotiSub);
    }

    await this.updateSeenMessagesAndViewTime(user);
    this.router.navigate(['/message/' + this.selectedFriend.friendId]);
  }

  updateSeenMessagesAndViewTime = (user: any) => {
    return new Promise((res, rej) => {
      // this.updateSeenMessages();
      // Üzenetek a kiválasztott baráttól tömb iteráció
      this.allChatsArray.map(mess => {
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
          mess.message.viewTimeStamp = this.utilService.calcMinutesPassed(
            mess.message.timeStamp
          );
        }
        // az iteráció végén visszaad minden üzenetet(módosítva)
        return mess;
      });
    });
  };

  getNewMessages() {
    this.getNewMessSub = this.base
      .getFriends(this.userProfile.key)
      .subscribe(frArr => {
        const nMessFrs = frArr.filter(fr => fr.newMessageNumber);
        this.haventSeenMessagesArr = nMessFrs;
        let arr: any[] = [];
        let forNewMessNotiSub: any[] = [];
        nMessFrs.map(fr => {
          const frProf = this.userProfiles.find(uP => uP.uid === fr.friendId);
          if (fr?.newMessageNumber && fr?.archived) {
            const body: any = { archived: false };
            fr.archived = false;
            fr.displayName = frProf?.displayName;
            fr.profilePicture = frProf?.profilePicture;
            this.utilService.userFriends = this.utilService.userFriends.filter(
              friend => friend.friendId !== fr.friendId
            );
            this.utilService.userFriends.unshift(fr);
            this.base.updateFriend(fr.friendKey!, body, this.userProfile.key);
          }
          forNewMessNotiSub.push({
            friendId: fr.friendId,
            newMessageNumber: fr.newMessageNumber,
            displayName: frProf?.displayName,
          });
          arr.push(fr.friendId, {
            newMessageNumber: fr.newMessageNumber,
            newMessSentTime: fr.newMessSentTime,
          });
        });
        this.base.newMessageNotiSubject.next(forNewMessNotiSub);
        this.showFriendsMess.map(fr => {
          if (arr.includes(fr.friendId)) {
            const nMNumberInd = arr.indexOf(fr.friendId) + 1;
            fr.newMessageNumber = arr[nMNumberInd].newMessageNumber;
            fr.newMessSentTime = arr[nMNumberInd].newMessSentTime;
          }
        });

        console.log(`****GETNEWMESS FILTERSHOWFRMS****`);
        this.userFriends?.map((fr, ind) => {
          if (fr?.messaging) {
            const msgsObs = this.base.getUserMessagesRefactored(
              this.userProfile.uid,
              fr.friendId,
              this.userProfile.key,
              fr.friendKey!,
              true
            );
            const sub = msgsObs.subscribe(async pr => {
              const lastMsgsArr = await pr;
              lastMsgsArr.sort(
                (a, b) => a?.message?.timeStamp - b?.message?.timeStamp
              );
              const lastMsgObj = lastMsgsArr[1];
              const sentMessAlreadyArr: any[] = [];

              this.lastMsgsWithFriends?.map((lastMsg, i) => {
                if (ind === i && lastMsg?.message?.message) {
                  if (!sentMessAlreadyArr.includes(lastMsg?.message?.senderId))
                    sentMessAlreadyArr.push(lastMsg?.message?.senderId);
                }
              });
              if (this.lastMsgsWithFriends?.length) {
                const dsg = this.lastMsgsWithFriends?.find(
                  lstMsg =>
                    lastMsgObj?.message?.senderId === lstMsg?.message?.senderId
                );
                if (dsg)
                  this.lastMsgsWithFriends = this.lastMsgsWithFriends?.filter(
                    lstMsg => dsg?.key !== lstMsg?.key
                  );
                this.lastMsgsWithFriends.push(lastMsgObj);
              }

              sub.unsubscribe();
            });
          }
        });
        if (!this.isRemoveFrFromShowFriendsMess)
          this.showFriendsMess = this.utilService.filterShowFriendsMessArr(
            this.haventSeenMessagesArr!,
            this.showFriendsMess
          );
      });
  }

  // updateSeenMessages() {
  //   // látott üzenetek kiszűrése a tömbből
  //   console.log(this.haventSeenMessagesArr);
  //   this.haventSeenMessagesArr = this.haventSeenMessagesArr?.map(mess => {
  //     console.log(mess);
  //     if (mess.message.senderId === this.selectedFriend.friendId) {
  //       mess.message.seen = true;
  //       return undefined;
  //     }
  //     if (mess.message.senderId !== this.selectedFriend.friendId) {
  //       return mess;
  //     }
  //   });
  //   this.haventSeenMessagesArr = this.haventSeenMessagesArr?.filter(
  //     mess => mess !== undefined
  //   );
  //   this.showFriendsMess = this.utilService.filterShowFriendsMessArr(
  //     this.haventSeenMessagesArr!,
  //     this.showFriendsMess
  //   );
  //   this.runMessagesSubjectValueTransfer();
  //   console.log(`UPDATESEENMSGS`);
  // }

  runMessagesSubjectValueTransfer() {
    this.base.getAllMessagesSubject.next({
      haventSeenMessagesArr: this.haventSeenMessagesArr,
      allChatsArray: this.allChatsArray,
      showFriendsMess: this.showFriendsMess,
    });
  }

  ngOnDestroy(): void {
    if (this.getAllMessagesSubjectSub)
      this.getAllMessagesSubjectSub.unsubscribe();
    if (this.haventSeenMsgsArrSubjSub)
      this.haventSeenMsgsArrSubjSub.unsubscribe();
    if (this.messSubscription) {
      this.messSubscription.unsubscribe();
    }
    if (this.getNewMessSub) this.getNewMessSub.unsubscribe();
    if (this.userProfilesSub) this.userProfilesSub.unsubscribe();
  }
}
