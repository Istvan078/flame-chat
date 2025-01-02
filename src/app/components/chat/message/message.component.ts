import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { Friends, UserClass } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { UtilityService } from 'src/app/services/utility.service';
import { FilesModalComponent } from '../../modals/files-modal/files-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { Chat, ReplyMessage } from 'src/app/models/chat.model';
import * as deepMerge from 'deepmerge';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Notification } from 'src/app/models/notification.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Environments } from 'src/app/environments';
import { AuthService } from 'src/app/services/auth.service';
import { MatModalComponent } from '../../modals/mat-modal/mat-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
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

  // PUSH ÉRTESÍTÉS //
  friendPushSub: any;

  // HANGFELVÉTEL //
  audioStream!: MediaStream;
  audioChunks: Blob[] = [];
  mediaRecorder!: MediaRecorder;

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
    private router: Router
  ) {}

  async ngOnInit() {
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
            this.allChatsArray = await this.base.getUserMessagesRefactored(
              this.userProfile.uid,
              this.selectedFriendId!,
              this.userProfile.key,
              this.selectedFriend.key
            );
            console.log(this.allChatsArray);
            this.base.messageTransferSub.next(false);

            // if (
            //   !this.base.getAllMessagesSubject.value.allChatsArray?.length ||
            //   this.base.messageTransferSub.value === true
            // ) {

            // }
            this.messSubscription = this.getNewMessages();
            this.getVisibleMessagesForSelectedFriend();
            this.animateMessages();
            /////// ONLINE-E A KIVÁLASZTOTT ISMERŐS ////////////
            // this.frOnlineStateSub = this.getFrOnlineState();
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
              // this.settingFilesArr();
            } // Ez után
            this.userProfilesSub.unsubscribe();
          });
        }
        // this.messTransfSubscr.unsubscribe();
      }
    );
  }

  animateMessages() {
    this.chatAnimationState =
      this.chatAnimationState === 'in-2' ? 'normal' : 'normal';
  }

  addMessage() {
    new Promise((res, rej) => {
      this.setMessage(this.message as any, false);
      res('Üzenet tulajdonságai beállítva, üzenet objektum lemásolva.');
    }).then(res => {
      this.base
        .updateMessage(
          this.message['key'],
          this.message,
          this.userProfile.key,
          this.selectedFriend.key
        )
        .then(() => {
          this.sendMessage(this.message as Chat & ReplyMessage);
          if (this.filesArr.length) {
            const dataForFiles = {
              files: this.filesArr,
              chatId: this.message.key,
              senderId: this.userProfile.uid,
              receiverId: this.selectedFriendId,
            };
            this.firestore
              .addFilesToChat(dataForFiles, this.userProfile.key as string)
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
          this.message = new Chat();
          console.log(res, 'Sikeres üzenetfelvitel az adatbázisba.');
        });
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
        console.log(this.userProfile.key);
        console.log(this.selectedFriend.key);
        this.updateChatsAndVisMessArr(reply);
        this.sendMessNotifications(reply);
        replDiagSub.unsubscribe();
      }
      replDiagSub.unsubscribe();
    });
  }
  updateFrsFrObj: any = {};
  async setMessage(
    message: Chat & ReplyMessage,
    isEmailOn: boolean,
    replyMessage?: string
  ) {
    const actualTime = new Date().getTime();
    message.message = {
      displayName: this.userProfile.displayName!,
      email: this.userProfile.email!,
      profilePhoto: this.userProfile.profilePicture,
      senderId: this.userProfile.uid,
      seen: false,
      timeStamp: actualTime as any,
      senderId_receiverId: `${this.userProfile.uid}_${this.selectedFriendId}_${actualTime}`,
      message: replyMessage ? replyMessage : message.message.message, // MEGCSINÁLNI
    };
    console.log(message.message.timeStamp);
    message._setKey =
      this.userProfile.uid + this.utilService.randomIdGenerator(message);
    // message.participants[0] = this.userProfile.uid + '-' + actualTime;
    message.participants[1] = this.selectedFriendId!;
    // message.participants[2 as any] =
    // this.userProfile.uid + this.selectedFriendId + '-' + actualTime;
    // let selectedFriend: any = {}
    const uProfsObs = await this.utilService.getUserProfiles();
    const uProfsSub = uProfsObs.subscribe(async allUsrDtls => {
      this.selectedFriend = allUsrDtls.userProfiles.find(
        uP => uP.uid === this.selectedFriendId
      );
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
      console.log(this.updateFrsFrObj);
      uProfsSub.unsubscribe();
      // this.sendMessage(message)
      // await this.base.updateFriendsFriend(
      //   this.selectedFriend.key!,
      //   this.userProfile.key,
      //   this.updateFrsFrObj
      // );
    });

    if (isEmailOn)
      this.base.sendMessNotificationEmail(
        this.selectedFriend,
        this.message,
        this.userProfile
      );
  }

  // async setNewMessageNum() {}

  async sendMessage(message: Chat & ReplyMessage) {
    const actualTime = new Date().getTime();
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

  updateSeenMessages(mess: Chat[] | ReplyMessage[], isFriendMessage: boolean) {
    console.log(mess);

    if (!isFriendMessage && this.getUpdatedMessagesCounter === 2)
      mess.map(mess => {
        if (
          mess.message.senderId === this.userProfile.uid &&
          mess.participants[1] === this.selectedFriendId &&
          !mess.message.seen
        ) {
          mess.message.seen = true;
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

  deleteMessage(message: Chat) {
    this.base.deleteMessage(message).then(() => {
      this.urlText = [];
      this.allChatsArray = this.allChatsArray.filter(
        mess => mess.key !== message.key
      );
      this.getVisibleMessagesForSelectedFriend();
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

  sendMessNotifications(mess: Chat | ReplyMessage) {
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
        .post(apiUrl + 'message', { msg: msg, sub: pushSub })
        .subscribe(res => console.log(res));
    });
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

  async recordVoiceMessage() {
    this.audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    this.mediaRecorder = new MediaRecorder(this.audioStream);
    this.mediaRecorder.start();
    this.message.message.voiceMessage = 'recording-started';
  }

  async stopRecordingVoiceMessage() {
    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      this.audioChunks.push(event.data);
      const nameForFile = this.generateNameForFile('m4a');
      const recordedAudioFile = new File(this.audioChunks, nameForFile, {
        type: 'audio/x-m4a',
      });
      // const url = URL.createObjectURL(recordedAudioFile);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = 'felvetel.m4a';
      // document.body.appendChild(a);
      // a.click();
      // document.body.removeChild(a);
      // URL.revokeObjectURL(url);
      this.audioChunks = [];
      this.selectedFiles.push(recordedAudioFile);
      this.uploadFiles();
    };
    this.mediaRecorder.stop();
    this.audioStream.getTracks().forEach(track => {
      track.stop();
    });
  }

  selectedFs($event: any) {
    this.uploadFinished = false;
    this.selectedFiles = Array.from($event.target.files);
  }

  uploadFiles() {
    let arr: any = [];
    this.disabled = true;
    this.selectedFiles.map(async (file: any) => {
      const videoFile: any = this.uploadVideo(this.selectedFiles);
      if (videoFile[0]?.size) {
        this.addFilesForMessage(videoFile[0], arr);
      }
      if (!file?.name?.includes('.mp4')) {
        const fileBlob = await this.utilService.resizeImage(
          file,
          768,
          480,
          0.8
        );
        const fileBlobArr = [fileBlob];
        const newFile = new File(fileBlobArr, file.name, {
          type: fileBlob.type,
        });
        this.addFilesForMessage(newFile, arr);
        console.log(newFile);
      }
    });

    this.firestore.filesSubject.subscribe((file: any) => {
      this.filesArr.push(file);
      this.disabled = false;
      if (
        file.fileName.includes(this.selectedFriend.displayName) &&
        !file.fileName.includes('.mp4') &&
        !file.fileName.includes('.jpg') &&
        !file.fileName.includes('.jpeg') &&
        !file.fileName.includes('.png')
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

  getVisibleMessagesForSelectedFriend(): any[] {
    this.allChatsArray = this.allChatsArray.filter(
      ch =>
        ch.message.senderId === this.selectedFriendId ||
        (ch.message.senderId === this.userProfile.uid &&
          ch.participants[1] === this.selectedFriendId)
    );

    this.allChatsArray.map(mess => {
      if (
        !mess.message?.seen &&
        mess.message.senderId === this.selectedFriendId
      ) {
        mess.message.seen = true;
        this.base
          .updateMessage(
            mess.key,
            mess,
            this.selectedFriend.key,
            this.userProfile.key
          )
          .then(() => {});
      }
      mess.message.viewTimeStamp = this.calcMinutesPassed(
        mess.message.timeStamp
      );
      mess.message.timeStamp = new Date(mess.message.timeStamp).getTime();
    });

    this.allChatsArray.sort((a: any, b: any) => {
      if (a.message.timeStamp < b.message.timeStamp) return 1;
      else return -1;
    });
    // Kiválasztom az első 15 üzenetet
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
    return this.visibleMessages;
  }

  // getFrOnlineState() {
  //   return this.base
  //     .getUserProfile(this.selectedFriend.key)
  //     .subscribe((st: any) => {
  //       this.selectedFriend.online = st.online;
  //     });
  // }

  getUpdatedMessages() {
    return this.base
      .getUpdatedMessages(this.userProfile.key, this.selectedFriend.key)
      .subscribe(async mess => {
        console.log(`***FRISSÍTETT ÜZENETEK LEKÉRVE***`);
        this.updateSeenMessages(this.allChatsArray, false);
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
      console.log(updateFrObj);
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
        console.log(mess);
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
    });
    modalRef.componentInstance.picturesArr = picturesArr;
    modalRef.componentInstance.viewIndex = i;
  }

  runMessagesSubjectValueTransfer() {
    this.base.getAllMessagesSubject.next({
      haventSeenMessagesArr: this.haventSeenMessagesArr,
      allChatsArray: this.allChatsArray,
    });
  }

  ngOnDestroy(): void {
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
  }
}
