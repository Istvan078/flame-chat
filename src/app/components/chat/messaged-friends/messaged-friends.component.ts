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

  constructor(
    private base: BaseService,
    private utilService: UtilityService,
    private element: ElementRef,
    private router: Router
  ) {}
  async ngOnInit() {
    const AllUserDtlsRes = await this.utilService.getUserProfiles();
    this.userProfilesSub = AllUserDtlsRes.subscribe(async AllUserDtls => {
      this.userProfiles = AllUserDtls.userProfiles;
      this.userProfile = AllUserDtls.userProfile;
      this.userFriends = AllUserDtls.userFriends!;
      console.log('ÖSSZES FELHASZNÁLÓ ADAT MEGÉRKEZETT A UTIL SERVICE-TŐL');
      this.filterShowFriendsMessArr();
      this.messSubscription = this.getNewMessages();
      await this.areFriendsOnline();
      this.onAnimate();
      this.userProfilesSub.unsubscribe();
    });
    this.getAllMessagesSubjectSub = this.base.getAllMessagesSubject.subscribe(
      obj => {
        if (obj.allChatsArray) this.allChatsArray = obj.allChatsArray;
        if (obj.showFriendsMess) this.showFriendsMess = obj.showFriendsMess;
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
      // const showAllFriendsCont = this.element.nativeElement.querySelector(
      //   '.showAllFriendsCont'
      // );

      messageCardElements.forEach((el: any) => {
        if (mess.displayName === el.innerText) {
          const container = el.parentNode.parentNode;
          window.scrollTo(
            el.getBoundingClientRect().x,
            el.getBoundingClientRect().y
            // showAllFriendsCont.getBoundingClientRect().height
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

  async getMessageUser(user: any) {
    this.selectedFriend = user; // objektum
    this.sendPrivateMessageOn = true;
    this.userMessages = true;
    this.isMessageOn = true;
    this.base.messageTransferSub.next(true);
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
    const userProfile = this.userProfile;
    return this.base.getNewMessages(this.userProfile.key).subscribe(mess => {
      this.filterShowFriendsMessArr();
      let msgArr: any[] = [];
      if (mess.length) {
        msgArr = mess;
        // let keyArr: any[] = [];
        // this.allChatsArray.map((jSM: any) => {
        //   keyArr.push(jSM.key);
        // });
        msgArr = msgArr.filter(
          msg =>
            // !keyArr.includes(msg.key) &&
            msg.message.seen === false &&
            msg.message.senderId !== userProfile?.uid &&
            msg.participants[1] === userProfile?.uid
        );
      }
      this.haventSeenMessagesArr = [];
      if (msgArr.length < 1) {
        this.filterShowFriendsMessArr();
      }
      for (let msg of msgArr) {
        msg.message.viewTimeStamp = this.utilService.calcMinutesPassed(
          new Date(msg.message.timeStamp)
        );
        if (msg.participants[1] === userProfile?.uid) {
          this.haventSeenMessagesArr?.push(msg);
          this.allChatsArray.unshift(msg);
          this.base.getAllMessagesSubject.next({
            allChatsArray: this.allChatsArray,
          });
          this.filterShowFriendsMessArr();
          this.base.messageTransferSub.next(true);
        }
      }
      if (this.userMessages) this.updateSeenMessages();
      this.utilService.subjectValueTransfer(
        this.haventSeenMessagesArr,
        this.base.newMessageNotiSubject
      );
      this.runMessagesSubjectValueTransfer();
    });
  }

  updateSeenMessages() {
    // látott üzenetek kiszűrése a tömbből
    this.haventSeenMessagesArr = this.haventSeenMessagesArr?.map(mess => {
      if (mess.message.senderId === this.selectedFriend.friendId) {
        mess.message.seen = true;
        this.base.updateMessage(mess.key, mess, this.userProfile.key);
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
    this.utilService.subjectValueTransfer(
      this.haventSeenMessagesArr,
      this.base.newMessageNotiSubject
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
  }
}
