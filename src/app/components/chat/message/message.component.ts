import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { catchError, map, Observable, of, Subject, Subscription } from 'rxjs';
import { Friends, UserClass } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { UtilityService } from 'src/app/services/utility.service';
import { FilesModalComponent } from '../../modals/files-modal/files-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { Chat, ReplyMessage } from 'src/app/models/chat.model';
import deepmerge, * as deepMerge from 'deepmerge';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Notification } from 'src/app/models/notification.model';
import { HttpClient } from '@angular/common/http';
import { Environments } from 'src/app/environments';
import { AuthService } from 'src/app/services/auth.service';
import { MatModalComponent } from '../../modals/mat-modal/mat-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../../snackbar/snackbar.component';
import { SharedModule } from '../../shared/shared.module';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
  standalone: true,
  imports: [SharedModule],
  animations: [
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
  ],
})
export class MessageComponent implements OnInit, OnDestroy {
  @Input() visibleMessages: any[] = [];
  @Input() selectedFriend: any;
  @Input() sentFilesArr: any[] = [];
  @Input() textMessages: any;
  @Input() urlText: any[] = [];
  @Input() messageButtonClicked: boolean = false;

  // ANIMÁCIÓVAL KAPCSOLATOS //
  chatAnimationState: string = 'in-2';

  // ÜZENETEK //
  allChatsArray: any[] = [];
  message: Chat = new Chat();
  showFriendsMess: any[] = [];
  haventSeenMessagesArr: any[] = [];
  getUpdatedMessagesCounter: number = 0;
  reactions: any[] = [];
  lastMsgPos: any;
  msgThemes: any[] = [];
  chosenMsgTheme: any;
  updateFrsFrObj: any = {};

  // FELHASZNÁLÓ //
  selectedFriendId?: string;
  userProfiles: UserClass[] = [];
  userProfile: UserClass = new UserClass();
  isUserOnlineNow: boolean = false;
  userFriends: Friends[] = [];

  // FÁJLOK //
  filesArr: any[] = [];
  selectedFiles: any[] = [];
  uploadFinished: boolean = true;
  disabled: boolean = false;

  searchWord: string = '';

  // ROUTING //
  isOnMessageRoute: boolean = false;

  // AI //
  hideAiBtn: boolean = false;
  aiLimit: number = 0;
  suggestions: string[] = [];
  loading = false;
  error = '';

  // PUSH ÉRTESÍTÉS //
  friendPushSub: any;

  // HANGFELVÉTEL //
  audioStream!: MediaStream;
  audioChunks: Blob[] = [];
  mediaRecorder!: MediaRecorder;

  // OBSERVER //
  intsectObsForMsgs!: IntersectionObserver;

  // FELIRATKOZÁSOK //
  userProfilesSub: Subscription = Subscription.EMPTY;
  getAllMessagesSubjectSub: Subscription = Subscription.EMPTY;
  userSubjectSub: Subscription = Subscription.EMPTY;
  filesBehSubjectSub: Subscription = Subscription.EMPTY;
  messSubscription: Subscription = Subscription.EMPTY;
  updatingMessSentTimeSub: Subscription = Subscription.EMPTY;
  updMessSub: Subscription = Subscription.EMPTY;
  frOnlineStateSub: Subscription = Subscription.EMPTY;
  messTransfSubscr: Subscription = Subscription.EMPTY;

  constructor(
    private utilService: UtilityService,
    private base: BaseService,
    private auth: AuthService,
    private firestore: FirestoreService,
    private ngbModal: NgbModal,
    private matDialog: MatDialog,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private snackbar: MatSnackBar,
    private domSanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    this.firestore.getAILimit().subscribe((lim: any[]) => {
      this.aiLimit = lim?.length ? lim[0]?.limit : 0;
      if (lim?.length && lim[0]?.limit >= 200) this.hideAiBtn = true;
      console.log('AI Hívások szama:', lim[0]?.limit);
    });
    this.base.isShowMessagesSubject.next(true);
    this.getAllMessagesSubjectSub = this.base.getAllMessagesSubject.subscribe(
      obj => {
        if (obj.allChatsArray) this.allChatsArray = obj.allChatsArray;
        if (obj.showFriendsMess) this.showFriendsMess = obj.showFriendsMess;
        // if (obj.haventSeenMessagesArr)
        //   this.haventSeenMessagesArr = obj.haventSeenMessagesArr;
      }
    );
    this.route.url.subscribe(urlSegm => {
      if (urlSegm.length) {
        const [{ path }] = urlSegm;
        if (urlSegm.length > 1) {
          const { path: friendId } = urlSegm[1];
          this.selectedFriendId = friendId;
        }
        if (path === 'message/') this.isOnMessageRoute = true;
      }
    });
    this.userSubjectSub = this.utilService.userSubject.subscribe(val => {
      this.userFriends = val.userFriends;
    });
    this.base.messageTransferSub.next(true);
    this.messTransfSubscr = this.base.messageTransferSub.subscribe(
      async isTrue => {
        if (
          // !this.base.getAllMessagesSubject.value.allChatsArray?.length ||
          isTrue
        ) {
          const AllUserDtlsRes = await this.utilService.getUserProfiles();
          this.userProfilesSub = AllUserDtlsRes.subscribe(async AllUserDtls => {
            this.utilService.forUserSubject.userProfiles =
              AllUserDtls.userProfiles;
            this.utilService.forUserSubject.userProfile =
              AllUserDtls.userProfile;
            this.utilService.subjectValueTransfer(
              this.utilService.forUserSubject,
              this.utilService.userSubject
            );
            this.userProfiles = AllUserDtls.userProfiles;
            this.userProfile = AllUserDtls.userProfile;
            this.selectedFriend = this.userProfiles.find(
              uP => uP.uid === this.selectedFriendId
            );
            this.base.selectedFriendSubject.next(this.selectedFriend);
            const sub = this.base
              .getUserMessagesRefactored(
                this.userProfile.uid,
                this.selectedFriendId!,
                this.userProfile.key,
                this.selectedFriend.key
              )
              .subscribe(async promise => {
                this.allChatsArray = await promise;
                this.getVisibleMessagesForSelectedFriend();
                sub.unsubscribe();
              });
            this.base.messageTransferSub.next(false);

            // if (
            //   !this.base.getAllMessagesSubject.value.allChatsArray?.length ||
            //   this.base.messageTransferSub.value === true
            // ) {

            // }
            this.messSubscription = this.getNewMessages();

            this.animateMessages();
            this.updMessSub = this.getUpdatedMessages();
            this.updateSeenMessages(this.allChatsArray, true);
            console.log(
              'ÖSSZES FELHASZNÁLÓ ADAT MEGÉRKEZETT A UTIL SERVICE-TŐL'
            );

            let docIdsArr: any[] = [];
            this.settingFilesArr();
            this.updatingMessSentTimeSub =
              this.updatingMessSentTime().subscribe();
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
            this.reactions = this.utilService.setReactionsArr();
            this.msgThemes = this.utilService.getMsgThemes();
            this.setMsgTheme();
            this.getFriendOnlineState();
            this.userProfilesSub.unsubscribe();
          });
        }
        // this.messTransfSubscr.unsubscribe();
      }
    );
  }

  async getAiReplies() {
    this.error = '';
    this.loading = true;
    const lastMsgFromFr = this.visibleMessages
      .filter(msg => msg.message.senderId === this.selectedFriend.uid)
      .sort((a: any, b: any) => {
        if (a.message.timeStamp < b.message.timeStamp) return 1;
        else return -1;
      })[0];
    try {
      this.suggestions = await this.utilService.suggestReplies(
        lastMsgFromFr.replyMessage?.message
          ? lastMsgFromFr.replyMessage.message
          : lastMsgFromFr.message.message
      );
      this.firestore.updateAiUsage({
        limit: this.aiLimit === 0 ? 1 : this.aiLimit + 1,
        userId: this.userProfile.uid,
        userKey: this.userProfile.key,
        user: this.userProfile.displayName,
        timestamp: new Date().getTime(),
      });
      if (this.aiLimit + 1 >= 200) {
        this.hideAiBtn = true;
        const snackBar = this.snackbar.openFromComponent(SnackbarComponent, {
          data: { message: 'Elérted az AI hívások napi limitjét.' },
          horizontalPosition: 'center',
          verticalPosition: 'top',
          duration: 5000,
        });
        snackBar.instance.aiLimitReached = true;
      }
    } catch (e: any) {
      this.error = e?.message ?? 'Hiba történt az AI híváskor.';
    } finally {
      this.loading = false;
    }
  }

  insertReply(text: string) {
    // TODO: illeszd be a chat inputodba / küldd el
    this.message.message.message = text;
    this.addMessage();
    this.suggestions = [];
    console.log('Kiválasztott:', text);
  }

  scrollToLastMsg() {
    const outletContainer = document.querySelector('.outlet-cont');
    outletContainer?.scrollTo(0, 0);
  }

  animateMessages() {
    this.chatAnimationState =
      this.chatAnimationState === 'in-2' ? 'normal' : 'normal';
  }
  setMsgTheme() {
    const friend = this.userFriends.find(
      fr => this.selectedFriendId === fr.friendId
    );
    this.chosenMsgTheme = (friend as any).chosenTheme;
    this.base.chosenMsgThemeSubject.next((friend as any).chosenTheme);
  }

  async showFriendsProfPics() {
    await this.base.showProfPics(this.selectedFriend.email);
  }

  getFriendOnlineState() {
    this.selectedFriend.lastTimeOnline = this.utilService.calcMinutesPassed(
      this.selectedFriend.lastTimeOnline
    );
  }

  async setReactionForMsg(msg: Chat, reac: any) {
    msg.message.reaction = {
      reactionIcon: reac.reactionIcon,
      color: reac.color,
    };
    this.sendReactionNotif(msg, reac.reactionName);
    await this.base.updateMessage(
      msg.key,
      msg,
      this.selectedFriend.key,
      this.userProfile.key
    );
  }

  addMessage() {
    if (
      this.message.message.message ||
      this.filesArr?.length ||
      this.message.message.voiceMessage
    )
      new Promise((res, rej) => {
        this.setMessage(this.message as any, false);
        res('Üzenet tulajdonságai beállítva, üzenet objektum lemásolva.');
      }).then(res => {
        const checkNewMessNumInt = setInterval(() => {
          if (this.updateFrsFrObj?.newMessageNumber) {
            this.sendMessage(this.message as Chat & ReplyMessage);
            this.base
              .updateMessage(
                this.message['key'],
                this.message,
                this.userProfile.key,
                this.selectedFriend.key
              )
              .then(() => {
                if (this.filesArr.length) {
                  const dataForFiles = {
                    files: this.filesArr,
                    chatId: this.message.key,
                    senderId: this.userProfile.uid,
                    receiverId: this.selectedFriendId,
                  };
                  this.firestore
                    .addFilesToChat(
                      dataForFiles,
                      this.userProfile.key as string
                    )
                    .then(() => {
                      this.firestore.filesSubject.unsubscribe();
                      this.firestore
                        .addFilesToChat(
                          dataForFiles,
                          this.selectedFriend?.key as string
                        )
                        .then(() => {
                          this.firestore.filesSubject = new Subject();
                          this.filesArr = [];
                        });
                    });
                }
                this.updateChatsAndVisMessArr(this.message);
                this.sendMessNotifications(this.message);
                this.scrollToLastMsg();
                this.message = new Chat();
                console.log(res, 'Sikeres üzenetfelvitel az adatbázisba.');
              });
            clearInterval(checkNewMessNumInt);
          }
        }, 200);
      });
  }

  async replyMessage(mess: Chat & ReplyMessage) {
    const voiceMessage: string = '';
    const reply = new ReplyMessage({
      message: '',
      voiceMessage: voiceMessage !== '' ? voiceMessage : '',
    });
    const replyDialog = this.matDialog.open(MatModalComponent);
    replyDialog.componentInstance.isReplyForMessage = true;
    replyDialog.componentInstance.oldMessage = mess;
    replyDialog.componentInstance.replyMessage = reply;
    let oldReplyMessage;
    if (mess.replyMessage?.message) {
      oldReplyMessage = mess.replyMessage.message;
      await this.setMessage(reply, false, oldReplyMessage);
      console.log('Már válaszoltam');
    } else {
      reply.message.message = mess.message.message;
      await this.setMessage(reply, false);
      console.log('Még nem válaszoltam', reply);
    }
    const replDiagSub = replyDialog.afterClosed().subscribe(async dat => {
      if (dat === 'message-sent') {
        console.log(reply);
        await this.sendMessage(reply);
        await this.base.updateMessage(
          reply.key,
          reply,
          this.userProfile.key,
          this.selectedFriend.key
        );
        this.updateChatsAndVisMessArr(reply);
        this.sendMessNotifications(reply);
        this.scrollToLastMsg();
        replDiagSub.unsubscribe();
      }
      replDiagSub.unsubscribe();
    });
  }
  async setMessage(
    message: Chat & ReplyMessage,
    isEmailOn: boolean,
    replyMessage?: string
  ) {
    const actualTime = new Date().getTime();
    message.message = {
      ...message.message,
      displayName: this.userProfile.displayName!,
      email: this.userProfile.email!,
      profilePhoto: this.userProfile.profilePicture,
      senderId: this.userProfile.uid,
      seen: false,
      timeStamp: actualTime as any,
      senderId_receiverId: `${this.userProfile.uid}_${this.selectedFriendId}_${actualTime}`,
      message: replyMessage ? replyMessage : message.message.message,
    };
    // MEGNÉZNI HOGY HÁNYADIK ÜZENET ÉS EGYET HOZZÁADNI AZ ÚJ KEY LEGVÉGÉHEZ
    let newMsgNum: any;
    if (this.visibleMessages?.length) {
      const lastMsgKeyArr = this.visibleMessages[0].key.split('_');
      newMsgNum = +lastMsgKeyArr[1] + 1;
    } else newMsgNum = 1;
    newMsgNum.toString();
    message._setKey = this.userProfile.uid + '_' + newMsgNum;
    message.participants[1] = this.selectedFriendId!;
    const uProfsObs = await this.utilService.getUserProfiles();
    const uProfsSub = uProfsObs.subscribe(async allUsrDtls => {
      this.selectedFriend = allUsrDtls.userProfiles.find(
        uP => uP.uid === this.selectedFriendId
      );
      this.getFriendOnlineState();
      const arr = Object.values(this.selectedFriend.friends);
      const meForFr: any = arr.find(
        (fr: any) => this.userProfile.uid === fr.friendId
      );
      if (meForFr?.newMessageNumber)
        meForFr.newMessageNumber = meForFr.newMessageNumber + 1;
      if (!meForFr?.newMessageNumber) meForFr!.newMessageNumber = 1;
      this.updateFrsFrObj = {
        friendId: meForFr?.friendId,
        friendKey: meForFr?.friendKey,
        seenMe: meForFr?.seenMe,
        newMessageNumber: meForFr?.newMessageNumber,
      };
      if (meForFr?.areFriends)
        this.updateFrsFrObj.areFriends = meForFr.areFriends;
      if (meForFr?.confirmed) this.updateFrsFrObj.confirmed = meForFr.confirmed;
      if (meForFr?.messaging) this.updateFrsFrObj.messaging = meForFr.messaging;
      this.updateFrsFrObj.newMessSentTime = meForFr.newMessSentTime =
        new Date().getTime();
      uProfsSub.unsubscribe();
    });

    if (isEmailOn)
      this.base.sendMessNotificationEmail(
        this.selectedFriend,
        this.message,
        this.userProfile
      );
  }

  getLastIntersectingMsg() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 1.0,
    };
    this.intsectObsForMsgs = new IntersectionObserver(
      (
        entries: IntersectionObserverEntry[],
        observer: IntersectionObserver
      ) => {
        setTimeout(() => {
          this.lastMsgPos = document.getElementById(
            `msg-${this.visibleMessages.length - 1}`
          );
        }, 1500);
        const [entry] = entries;
        if (entry.isIntersecting) {
          console.log('****INTERSECTIONOBS***', entry);
          this.scrollMsgs();
          observer.unobserve(this.lastMsgPos!);
          setTimeout(() => {
            observer.observe(this.lastMsgPos!);
          }, 2000);
        }
      },
      options
    );
    const int = setInterval(() => {
      this.lastMsgPos = document.getElementById(
        `msg-${this.visibleMessages.length - 1}`
      );
      if (this.lastMsgPos) {
        this.intsectObsForMsgs.observe(this.lastMsgPos!);
        clearInterval(int);
      }
    }, 200);
    return this.intsectObsForMsgs;
  }

  async toDoDevFunction() {}

  async sendMessage(message: Chat & ReplyMessage) {
    const actualTime = new Date().getTime();
    message.message.status = 'sent';
    message.message.timeStamp = actualTime as any;
    message.message.senderId_receiverId = `${this.userProfile.uid}_${this.selectedFriendId}_${actualTime}`;
    message.participants[0] = this.userProfile.uid + '-' + actualTime;
    message.participants[2 as any] =
      this.userProfile.uid + this.selectedFriendId + '-' + actualTime;
    await this.base.updateFriendsFriend(
      this.selectedFriend.key!,
      this.userProfile.key,
      this.updateFrsFrObj
    );
    console.log('ÜZENET ELKÜLDVE, JELZÉS BARÁTNAK ELKÜLDVE');
  }

  updateChatsAndVisMessArr(message: Chat | ReplyMessage) {
    const messageCopy = deepMerge.all([message]);
    this.allChatsArray.unshift(messageCopy);
    this.getVisibleMessagesForSelectedFriend();
    this.base.getAllMessagesSubject.next({
      allChatsArray: this.allChatsArray,
    });
  }

  editMessage(msg: Chat & ReplyMessage) {
    const modDialog = this.matDialog.open(MatModalComponent);
    modDialog.componentInstance.isModifyingMessage = true;
    (modDialog.componentInstance.oldMessage as any) = deepmerge(msg, {});
    const moddedMsg = modDialog.componentInstance.oldMessage;
    const replDiagSub = modDialog.afterClosed().subscribe(async dat => {
      if (dat === 'message-modified')
        await this.base.updateMessage(
          moddedMsg.key,
          moddedMsg,
          this.userProfile.key,
          this.selectedFriend.key
        );
      const index = this.visibleMessages.findIndex(
        mess => mess.key === msg.key
      );
      this.visibleMessages[index] = moddedMsg;
      replDiagSub.unsubscribe();
    });
  }
  async cancelMyMessage(msg: Chat & ReplyMessage) {
    msg.message.message = 'Ez az üzenet törölve lett';
    if (msg.replyMessage?.message) msg.replyMessage.message = '';
    msg.message.cancelled = true;
    await this.base.updateMessage(
      msg.key,
      msg,
      this.userProfile.key,
      this.selectedFriend.key
    );
  }

  updateSeenMessages(mess: Chat[] | ReplyMessage[], isFriendMessage: boolean) {
    if (!isFriendMessage && this.getUpdatedMessagesCounter === 2)
      mess.map(mess => {
        if (
          mess.message.senderId === this.userProfile.uid &&
          mess.participants[1] === this.selectedFriendId &&
          !mess.message.seen &&
          mess.message.status === 'delivered'
        ) {
          // mess.message.seen = true;
          mess.message.status = 'delivered';
          this.base.updateMessage(
            mess.key,
            mess,
            this.userProfile.key,
            this.selectedFriend.key
          );
        }
        return mess;
      });

    if (isFriendMessage)
      mess.map(mess => {
        if (
          mess.message.senderId === this.selectedFriendId &&
          mess.participants[1] === this.userProfile.uid &&
          !mess.message.seen
        ) {
          mess.message.seen = true;
          this.base.updateMessage(
            mess.key,
            mess,
            this.selectedFriend.key,
            this.userProfile.key
          );
        }
        return mess;
      });
    if (this.getUpdatedMessagesCounter < 2) this.getUpdatedMessagesCounter++;
  }

  updatingMessSentTime() {
    return new Observable(obs => {
      const int = setInterval(() => {
        /////////////////// LEÍRÁS ////////////////////////
        // Mikor írta az üzenetet beállítása a calcMinutesPassed() //
        // metódus segítségével(formázva)) //
        this.visibleMessages = this.visibleMessages.map(mess => {
          if (mess.message.viewTimeStamp) {
            mess.message.viewTimeStamp = this.utilService.calcMinutesPassed(
              mess.message.timeStamp
            );
          }
          // az iteráció végén visszaad minden üzenetet(módosítva)
          return mess;
        });
        if (this.updatingMessSentTimeSub.closed) clearInterval(int);
      }, 60000);
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
  }

  sendMessNotifications(mess: Chat | ReplyMessage, reaction?: any) {
    const apiUrl = Environments.API_URL;
    const msg: Notification = {
      displayName: mess.message.displayName,
      message: `${
        (mess.replyMessage as any)?.message
          ? (mess.replyMessage as any)?.message
          : mess.message.message
      }`,
      profilePhoto: mess.message.profilePhoto,
      timeStamp: mess.message.timeStamp,
      senderId: mess.message.senderId,
      reactedFriendId: mess.participants[1],
      reactedDName: this.userProfile?.displayName,
      reactedProfPhoto: this.userProfile.profilePicture,
    };

    new Promise(res => {
      this.firestore
        .getUserNotiSubscription(this.selectedFriend.key)
        .subscribe(sub => {
          this.friendPushSub = sub;
          if (this.friendPushSub !== undefined) {
            res(this.friendPushSub);
          }
        });
    }).then(pushSub => {
      this.http
        .post(apiUrl + 'message', {
          msg: msg,
          reaction: reaction,
          sub: pushSub,
        })
        .subscribe(res => console.log(res));
    });
  }

  scrollToWriteMsgArea() {
    const micContainer = document.getElementsByClassName('mic-container');
    const interval = setInterval(() => {
      if (micContainer) {
        const micContainerPosition = micContainer
          .item(0)
          ?.getBoundingClientRect().bottom;
        scrollTo(0, micContainerPosition!);
        clearInterval(interval);
      }
    }, 200);
  }

  settingFilesArr() {
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
        (file.receiverId === this.selectedFriendId &&
          file.files.length !== 0) ||
        file.senderId === this.selectedFriendId
      );
    });
  }

  sendReactionNotif(reactedMsg: any, chosenReaction: any) {
    const reaction = `Reagált az üzenetedre: ${chosenReaction}\n`;
    this.sendMessNotifications(reactedMsg, reaction);
  }
  sortingMsgsArr: any[] = [];
  scrollMsgs() {
    let counter: any = 1;
    let msgScrolled: number = 0;
    for (let i = 0; i < 15; i++) {
      let lastMsgNum: any =
        +this.visibleMessages[this.visibleMessages.length - 1]?.key.split(
          '_'
        )[1] - counter;
      counter++;
      lastMsgNum = lastMsgNum.toString();
      let isMyMsg: boolean = false;
      if (!isMyMsg) {
        const sub = this.base
          .getMessageByKey(
            this.userProfile.key,
            this.selectedFriend.key,
            lastMsgNum,
            this.selectedFriendId
          )
          .subscribe((msg: any) => {
            if (!msg) isMyMsg = true;
            if (msg) {
              msg.message.viewTimeStamp = this.utilService.calcMinutesPassed(
                msg.message.timeStamp
              );
              if (!msg.message?.message.includes('https://'))
                this.textMessages.push(msg);
              this.sortingMsgsArr.push(msg);
              msgScrolled++;
              console.log('****LEFUTÁS****', msg);
            }
            sub.unsubscribe();
          });
      }
      const int = setInterval(() => {
        if (isMyMsg) {
          const sub = this.base
            .getMessageByKey(
              this.selectedFriend.key,
              this.userProfile.key,
              lastMsgNum,
              this.userProfile.uid
            )
            .subscribe((msg: any) => {
              if (msg) {
                msg.message.viewTimeStamp = this.utilService.calcMinutesPassed(
                  msg.message.timeStamp
                );
                this.sortingMsgsArr.push(msg);
                // Leszűröm a csak szöveget tartalmazó üzeneteket és elmentem egy tömbbe
                if (!msg.message?.message.includes('https://'))
                  this.textMessages.push(msg);
                msgScrolled++;
                console.log('****LEFUTÁS****', msg);
              }
              clearInterval(int);
              sub.unsubscribe();
            });
        }
      }, 200);
    }
    const int = setInterval(() => {
      if (msgScrolled >= 15) {
        this.sortingMsgsArr.sort((a: any, b: any) => {
          if (a.message.timeStamp < b.message.timeStamp) return 1;
          else return -1;
        });
        this.visibleMessages.push(...this.sortingMsgsArr);
        this.sortingMsgsArr = [];
        console.log(`MESSAGE SORT AND FILTER AFTER SCROLL****`);
        clearInterval(int);
      }
    }, 200);
  }

  async recordVoiceMessage() {
    this.audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    // 1) MIME választás: iOS-nek mp4, egyébként webm/opus ha elérhető
    let preferredMime = '';
    if (this.isIOS() && MediaRecorder.isTypeSupported('audio/mp4')) {
      preferredMime = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      preferredMime = 'audio/webm;codecs=opus';
    }

    this.mediaRecorder = preferredMime
      ? new MediaRecorder(this.audioStream, { mimeType: preferredMime })
      : new MediaRecorder(this.audioStream);

    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = (event: Event) => {
      if (!this.audioChunks.length) return;
      // Valódi típus a blobból
      const actualType =
        this.audioChunks[0].type ||
        this.mediaRecorder.mimeType ||
        (this.isIOS() ? 'audio/mp4' : 'audio/webm');

      const ext = actualType.includes('mp4') ? 'm4a' : 'webm';
      const nameForFile = this.generateNameForFile(ext);
      const blob = new Blob(this.audioChunks, { type: actualType });
      const recordedAudioFile = new File([blob], nameForFile, {
        type: actualType,
      });
      this.audioChunks = [];
      this.selectedFiles = [recordedAudioFile];
      this.uploadFiles();
      // Stream leállítás
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
        this.audioStream = undefined as any;
      }
    };

    this.mediaRecorder.start();
    this.message.message.voiceMessage = 'recording-started';
  }

  async stopRecordingVoiceMessage() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }
  devFunction(msg: any) {
    console.log('DEV FUNCTION CALLED', msg.voiceMessage);
  }

  autoGrow(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.rows = 2;
    if (!textarea.value) textarea.rows = 1;
    // textarea.style.height = textarea.scrollHeight + 'px';
  }

  sanitize(url: string) {
    return this.domSanitizer.bypassSecurityTrustUrl(url);
  }

  isIOS(): boolean {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' &&
        (navigator as any).maxTouchPoints > 1)
    );
  }
  checkFileAccessible(url: string) {
    return this.http
      .head(url, { observe: 'response' })
      .pipe(catchError(err => of(err)));
  }

  selectedFs($event: any) {
    this.uploadFinished = false;
    this.selectedFiles = Array.from($event.target.files);
  }

  uploadFiles() {
    let arr: any = [];
    this.disabled = true;
    this.selectedFiles.map(async (file: any) => {
      console.log(file);
      if (
        file?.name?.includes('.m4a') ||
        file?.name?.includes('.webm') ||
        file?.name?.includes('.wav')
      ) {
        this.addFilesForMessage(file, arr);
      }

      const videoFile: any = this.uploadVideo(this.selectedFiles);
      if (videoFile[0]?.size) {
        this.addFilesForMessage(videoFile[0], arr);
      }
      if (
        !file?.name?.includes('.mp4') &&
        !file?.name?.includes('.m4a') &&
        !file?.name?.includes('.webm') &&
        !file?.name?.includes('.wav')
      ) {
        let fileBlob: any;
        if (file?.name?.toLowerCase()?.includes('screenshot'))
          fileBlob = await this.utilService.resizeImage(file, 600, 330, 1);
        fileBlob = await this.utilService.resizeImage(file, 768, 480, 0.8);
        const fileBlobArr = [fileBlob];
        const newFile = new File(fileBlobArr, file.name, {
          type: fileBlob.type,
        });
        this.addFilesForMessage(newFile, arr);
      }
    });

    this.firestore.filesSubject.subscribe((file: any) => {
      this.filesArr.push(file);
      this.disabled = false;
      const format = file.fileName.split('.').pop();
      if (
        file.fileName.includes(this.selectedFriend.displayName) &&
        !file.fileName.includes('.mp4') &&
        !this.isPicture(format)
      ) {
        this.message.message.voiceMessage = file.url;
        this.message.message.message = '';
      }
    });
  }

  addFilesForMessage(file: any, arr: any[]) {
    const promise = this.firestore
      .addFilesFromMessages(this.userProfile, file)
      ?.then((val: any) => {
        arr.push(val.metadata.name);
        if (
          arr.length === this.selectedFiles.length &&
          (this.isPicture(file.name?.split('.').pop()) ||
            file.name?.includes('.mp4'))
        ) {
          const fileModal = this.ngbModal.open(FilesModalComponent, {
            centered: true,
            animation: true,
          });
          fileModal.componentInstance.uploadTrue = true;
          this.uploadFinished = true;
          fileModal.componentInstance.uploadedFilesArr = this.filesArr;
        }
        this.selectedFiles = [];
      })
      .catch(err => {
        arr.push('Meglévő fájl');
        console.log('Már van ilyen fájl az adatbázisban');

        if (arr.length === this.selectedFiles.length) {
          this.selectedFiles = [];
          const fileModal = this.ngbModal.open(FilesModalComponent, {
            centered: true,
            animation: true,
          });
          fileModal.componentInstance.uploadTrue = true;
          this.uploadFinished = true;
          fileModal.componentInstance.uploadedFilesArr = this.filesArr;
        }
      });
  }

  isPicture(format: string) {
    const picTypesArr = ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp'];
    format = format?.toLowerCase();
    if (picTypesArr?.includes(format)) return true;
    return false;
  }

  uploadVideo(videoFiles: any[]) {
    if (videoFiles.length > 0) {
      return videoFiles.map(vf => {
        if (vf.type !== 'video/mp4') return [];
        const videoName = `${this.selectedFriend.displayName}_${videoFiles[0].name}`;
        const videoFile = new File(videoFiles, videoName, {
          type: 'video/mp4',
        });
        if (videoFile.size > 100022781) return [];
        return videoFile;
      });
    } else return [];
  }

  generateNameForFile(fileFormat: string) {
    const timeId = new Date().getTime();
    const fileName =
      this.selectedFriend.displayName + '_' + timeId + '.' + fileFormat;
    return fileName;
  }

  async getVisibleMessagesForSelectedFriend() {
    this.allChatsArray = this.allChatsArray.filter(
      ch =>
        ch.message.senderId === this.selectedFriendId ||
        (ch.message.senderId === this.userProfile.uid &&
          ch.participants[1] === this.selectedFriendId)
    );

    this.allChatsArray.map(async mess => {
      if (
        (!mess.message?.seen &&
          mess.message.senderId === this.selectedFriendId) ||
        (!mess.message.readAt &&
          mess.message.senderId === this.selectedFriendId)
      ) {
        mess.message.seen = true;
        mess.message.readAt = new Date().getTime();
        mess.message.status = 'read';
        await this.base.updateMessage(
          mess.key,
          mess,
          this.selectedFriend.key,
          this.userProfile.key
        );
      }
      mess.message.viewTimeStamp = this.utilService.calcMinutesPassed(
        mess.message.timeStamp
      );
      mess.message.timeStamp = new Date(mess.message.timeStamp).getTime();
      if (mess.message?.voiceMessage)
        this.checkFileAccessible(mess.message.voiceMessage).subscribe(
          isAccessible => {
            isAccessible.status === 404
              ? ((mess.message.message = 'A fajl nem elérhető'),
                (mess.message.voiceMessage = ''))
              : (mess.message.voiceMessage = mess.message.voiceMessage);
          }
        );
      return mess;
    });

    this.allChatsArray.sort((a: any, b: any) => {
      if (a.message.timeStamp < b.message.timeStamp) return 1;
      else return -1;
    });
    // Kiválasztom az első 15 üzenetet
    // this.visibleMessages = this.allChatsArray;
    this.visibleMessages = this.allChatsArray.slice(0, 15);
    // Leszűröm az urlt tartalmazó üzeneteket és elmentem egy tömbbe
    const urlMessages: Chat[] = this.visibleMessages.filter(mess =>
      mess.message?.message.includes('https://')
    );
    // Leszűröm a csak szöveget tartalmazó üzeneteket és elmentem egy tömbbe
    this.textMessages = this.visibleMessages.filter(
      mess => !mess.message?.message.includes('https://')
    );

    // kiszedem csak az url-t tartalmazó részt mindegyik üzenetből a szövegből és belerakom egy tömbbe
    urlMessages.map((mess, i) => {
      if (
        !this.urlText?.includes(mess.key) &&
        mess.message?.message.includes(' ')
      ) {
        const transformedUrl = mess.message.message.slice(
          mess.message?.message.indexOf('https://'),
          mess.message?.message.indexOf(
            ' ',
            mess.message?.message.indexOf('https://')
          )
        );
        const formattedText1stHalf = mess.message?.message.slice(
          0,
          mess.message?.message.indexOf(transformedUrl)
        );
        const formattedText2ndHalf = mess.message?.message.slice(
          mess.message?.message.indexOf(
            ' ',
            mess.message?.message.indexOf(transformedUrl)
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
        !mess.message?.message.includes(' ') &&
        !this.urlText?.includes(mess.key)
      ) {
        this.urlText.push(
          { url: mess.message?.message, chatId: mess.key },
          mess.key
        );
      }
    });
    console.log(`****GET VISIBLE MESSAGES***`);
    // INTERSECTION OBSERVER INTERSZEKTÁL A TÖMB UTOLSÓ ÜZENETÉNÉL ÉS SCROLLMSGS LEFUT
    // HA LEGALÁBB 14 ÜZENET VAN A TÖMBBEN
    if (this.visibleMessages?.length > 13) {
      if (!this.lastMsgPos) this.getLastIntersectingMsg();
      else {
        this.getLastIntersectingMsg().disconnect();
        this.getLastIntersectingMsg();
      }
    }
    console.log(this.visibleMessages);

    // this.visibleMessages.reverse();
    return this.visibleMessages;
  }

  getUpdatedMessages() {
    let delKeyArr: any[] = [];
    let readKeyArr: any[] = [];
    return this.base
      .getUpdatedMessages(this.userProfile.key, this.selectedFriend.key)
      .subscribe(async mess => {
        console.log(`***FRISSÍTETT ÜZENETEK LEKÉRVE***`, mess);
        mess.map((updatedMess: any) => {
          if (updatedMess.message?.status === 'delivered')
            delKeyArr.push(updatedMess.key);
          if (updatedMess.message?.status === 'read')
            readKeyArr.push(updatedMess.key);
        });
        this.visibleMessages.map(mess => {
          if (
            readKeyArr.includes(mess.key) &&
            (mess.message.status === 'delivered' ||
              mess.message.status === 'sent')
          )
            mess.message.status = 'read';
          if (delKeyArr.includes(mess.key) && mess.message.status !== 'read') {
            mess.message.status = 'delivered';
          }
        });
        // this.updateSeenMessages(this.allChatsArray, false);
      });
  }

  updateFrNewMessNumToZero(isNewMess?: boolean) {
    const selFriend = this.userFriends.find(
      fr =>
        (fr.friendId === this.selectedFriendId && fr.newMessageNumber) ||
        (isNewMess && fr.friendId === this.selectedFriendId)
    );
    if (selFriend?.friendId) {
      selFriend!.newMessageNumber = 0;
      const updateFrObj: any = {
        friendId: selFriend?.friendId,
        friendKey: selFriend?.friendKey,
        seenMe: selFriend?.seenMe,
        newMessageNumber: selFriend?.newMessageNumber,
      };
      if (selFriend?.areFriends) updateFrObj.areFriends = selFriend.areFriends;
      if (selFriend?.confirmed) updateFrObj.confirmed = selFriend.confirmed;
      if (selFriend?.messaging) updateFrObj.messaging = selFriend.messaging;
      this.base.updateFriend(
        this.selectedFriend.key,
        updateFrObj,
        this.userProfile.key
      );
    }
  }
  getNewMessages() {
    const userProfile = this.userProfile;
    this.updateFrNewMessNumToZero();
    return this.base
      .getNewMessages(this.userProfile.key, this.selectedFriend.key)!
      .subscribe(mess => {
        this.updateFrNewMessNumToZero(true);
        console.log('***ÚJ ÜZENETEK LEKÉRVE***');
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
              msg.message.senderId !== userProfile?.uid &&
              msg.participants[1] === userProfile?.uid
          );
          console.log(msgArr);
        }

        for (let msg of msgArr) {
          msg.message.viewTimeStamp = this.utilService.calcMinutesPassed(
            new Date(msg.message.timeStamp)
          );
          if (
            msg.participants[1] === userProfile?.uid &&
            msg.message.senderId === this.selectedFriendId
          ) {
            this.allChatsArray.unshift(msg);
            this.haventSeenMessagesArr.push(msg);
            this.updateSeenMessages(this.allChatsArray, false);
            //this.updMessSub = this.getUpdatedMessages();
            this.haventSeenMessagesArr.map(mess => {
              if (
                mess.message.senderId === this.selectedFriendId &&
                mess.participants[1] === this.userProfile.uid
              ) {
                mess.message.seen = true;
                mess.message.readAt = new Date().getTime();
                mess.message.status = 'read';
                this.base.updateMessage(
                  mess.key,
                  mess,
                  this.selectedFriend.key,
                  this.userProfile.key
                );
              }
              return mess;
            });
          }
        }
        this.getVisibleMessagesForSelectedFriend();
        this.scrollToLastMsg();
      });
  }

  backToUsers() {
    this.base.selectedFriendSubject.next(null);
    this.firestore.filesSubject.unsubscribe();
    this.firestore.filesSubject = new Subject();
    this.haventSeenMessagesArr = this.haventSeenMessagesArr.filter(
      mess => !mess.message.seen
    );
    this.base.getAllMessagesSubject.next({
      allChatsArray: this.visibleMessages,
      showFriendsMess: this.showFriendsMess,
    });
    this.base.haventSeenMsgsArr.next(this.haventSeenMessagesArr);
    this.router.navigate(['/message']);
  }

  fileModalOpen(picturesArr: [], i: number) {
    const modalRef = this.ngbModal.open(FilesModalComponent, {
      centered: true,
      fullscreen: true,
    });
    modalRef.componentInstance.picturesArr = picturesArr;
    modalRef.componentInstance.viewIndex = i;
  }

  chooseMsgTheme(theme: any) {
    this.chosenMsgTheme = theme.url;
    const selectedTheme = { chosenTheme: theme.url };
    this.base.chosenMsgThemeSubject.next(theme.url);
    this.base.updateFriend(
      this.selectedFriend.key,
      selectedTheme as any,
      this.userProfile.key
    );
  }

  onPlayAudio(audioElement: HTMLAudioElement) {
    audioElement.play();
  }

  ngOnDestroy(): void {
    this.base.isShowMessagesSubject.next(false);
    if (this.getAllMessagesSubjectSub)
      this.getAllMessagesSubjectSub.unsubscribe();
    if (this.messSubscription) {
      this.messSubscription.unsubscribe();
    }
    if (this.filesBehSubjectSub) this.filesBehSubjectSub.unsubscribe();
    if (this.userSubjectSub) this.userSubjectSub.unsubscribe();
    if (this.updatingMessSentTimeSub)
      this.updatingMessSentTimeSub.unsubscribe();
    if (this.updMessSub) this.updMessSub.unsubscribe();
    if (this.frOnlineStateSub) this.frOnlineStateSub.unsubscribe();
    if (this.messTransfSubscr) this.messTransfSubscr.unsubscribe();
    if (this.userProfilesSub) this.userProfilesSub.unsubscribe();
  }
}
