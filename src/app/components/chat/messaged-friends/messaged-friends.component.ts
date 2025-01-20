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
  showAllFriends: boolean = false;
  userFriends?: Friends[] = [];

  selectedFriend: any = {};

  // SZÁMLÁLÓK
  profSubCounter: number = 0;

  // ÜZENETEKKEL KAPCSOLATOS //
  haventSeenMessagesArr?: any[] = [];
  sendPrivateMessageOn: boolean = false;
  userMessages: boolean = false;
  isMessageOn: boolean = false;
  allChatsArray: any[] = [];
  messagesAccordionTabCounter: number = 0;

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
        await this.areFriendsOnline();

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

  areFriendsOnline() {
    return new Promise(res => {
      if (this.messagesAccordionTabCounter < 2)
        this.messagesAccordionTabCounter++;
      const initInterval = setInterval(() => {
        this.userFriends?.map(fr => {
          return this.userProfiles.map(uP => {
            if (uP.uid === fr.friendId) {
              if (uP.visibility) {
                fr.online = uP.online;
                fr.lastTimeOnline = this.utilService.calcMinutesPassed(
                  uP.lastTimeOnline
                );
                fr.visibility = true;
              }
            }
          });
        });
        const repeatingInterval = setInterval(() => {
          this.userFriends?.map(fr => {
            return this.userProfiles.map(uP => {
              if (uP.uid === fr.friendId) {
                if (uP.visibility) {
                  fr.online = uP.online;
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
      console.log(forNewMessNotiSub);
      this.base.newMessageNotiSubject.next(forNewMessNotiSub);
    }

    await this.updateSeenMessagesAndViewTime(user);
    this.router.navigate(['/message/' + this.selectedFriend.friendId]);
  }

  updateSeenMessagesAndViewTime = (user: any) => {
    return new Promise((res, rej) => {
      this.updateSeenMessages();
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
        let arr: any[] = [];
        let forNewMessNotiSub: any[] = [];
        nMessFrs.map(fr => {
          const frProf = this.userProfiles.find(uP => uP.uid === fr.friendId);
          forNewMessNotiSub.push({
            friendId: fr.friendId,
            newMessageNumber: fr.newMessageNumber,
            displayName: frProf?.displayName,
          });
          arr.push(fr.friendId, fr.newMessageNumber);
        });
        this.base.newMessageNotiSubject.next(forNewMessNotiSub);
        this.showFriendsMess.map(fr => {
          if (arr.includes(fr.friendId)) {
            const nMNumberInd = arr.indexOf(fr.friendId) + 1;
            fr.newMessageNumber = arr[nMNumberInd];
          }
        });
        if (!this.showFriendsMess.length)
          this.showFriendsMess = this.utilService.filterShowFriendsMessArr(
            this.haventSeenMessagesArr!,
            this.showFriendsMess
          );
      });
  }

  updateSeenMessages() {
    // látott üzenetek kiszűrése a tömbből
    this.haventSeenMessagesArr = this.haventSeenMessagesArr?.map(mess => {
      if (mess.message.senderId === this.selectedFriend.friendId) {
        mess.message.seen = true;
        return undefined;
      }
      if (mess.message.senderId !== this.selectedFriend.friendId) {
        return mess;
      }
    });
    this.haventSeenMessagesArr = this.haventSeenMessagesArr?.filter(
      mess => mess !== undefined
    );
    this.showFriendsMess = this.utilService.filterShowFriendsMessArr(
      this.haventSeenMessagesArr!,
      this.showFriendsMess
    );
    this.runMessagesSubjectValueTransfer();
  }

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
