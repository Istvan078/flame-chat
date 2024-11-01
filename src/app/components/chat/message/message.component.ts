import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { UserClass } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { UtilityService } from 'src/app/services/utility.service';
import { FilesModalComponent } from '../../modals/files-modal/files-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { Chat } from 'src/app/models/chat.model';
import * as deepMerge from 'deepmerge';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Notification } from 'src/app/models/notification.model';
import { HttpClient } from '@angular/common/http';
import { Environments } from 'src/app/environments';

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
  @Input() urlText: any;
  @Input() messageButtonClicked: boolean = false;
  // ANIMÁCIÓVAL KAPCSOLATOS //
  chatAnimationState: string = 'in-2';

  // ÜZENETEK //
  allChatsArray: any[] = [];
  sendPrivateMessageOn: boolean = true;
  message: Chat = new Chat();
  showFriendsMess: any[] = [];
  haventSeenMessagesArr: any[] = [];

  // FELHASZNÁLÓ //
  selectedFriendId?: string;
  userProfiles: UserClass[] = [];
  userProfile: UserClass = new UserClass();
  isUserOnlineNow: boolean = false;

  // FÁJLOK //
  filesArr: any[] = [];
  selectedFiles: any[] = [];
  uploadFinished: boolean = true;

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

  constructor(
    private utilService: UtilityService,
    private base: BaseService,
    private firestore: FirestoreService,
    private ngbModal: NgbModal,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  async ngOnInit() {
    this.getAllMessagesSubjectSub = this.base.getAllMessagesSubject.subscribe(
      obj => {
        if (obj.allChatsArray) this.allChatsArray = obj.allChatsArray;
        if (obj.showFriendsMess) this.showFriendsMess = obj.showFriendsMess;
        if (obj.haventSeenMessagesArr)
          this.haventSeenMessagesArr = obj.haventSeenMessagesArr;
        console.log(obj);
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
    const AllUserDtlsRes = await this.utilService.getUserProfiles();
    this.userProfilesSub = AllUserDtlsRes.subscribe(async AllUserDtls => {
      this.userProfiles = AllUserDtls.userProfiles;
      this.userProfile = AllUserDtls.userProfile;
      this.selectedFriend = this.userProfiles.find(
        uP => uP.uid === this.selectedFriendId
      );
      this.allChatsArray = await this.base.getUserMessagesRefactored(
        this.userProfile.uid,
        this.selectedFriendId!
      );
      this.messSubscription = this.getNewMessages();
      this.getVisibleMessagesForSelectedFriend();
      this.animateMessages();
      console.log('ÖSSZES FELHASZNÁLÓ ADAT MEGÉRKEZETT A UTIL SERVICE-TŐL');
      let docIdsArr: any[] = [];
      this.settingFilesArr();
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
      }
      this.userProfilesSub.unsubscribe();
    });
  }

  animateMessages() {
    this.chatAnimationState =
      this.chatAnimationState === 'in-2' ? 'normal' : 'normal';
  }

  addMessage() {
    new Promise((res, rej) => {
      const actualTime = new Date().getTime();
      if (this.userProfile.uid) {
        this.message.message.senderId_receiverId = `${this.userProfile.uid}_${this.selectedFriendId}`;
        this.message.message.senderId = this.userProfile.uid;
      }
      this.message.message.timeStamp = actualTime as any;
      this.message.participants[0] =
        this.userProfile.uid + '-' + new Date().getTime();
      this.message.participants[1] = this.selectedFriendId!;
      this.message.participants[2 as any] =
        this.userProfile.uid +
        this.selectedFriendId +
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
      this.message._setKey =
        this.userProfile.uid + this.utilService.randomIdGenerator(this.message);
      const messageCopy = deepMerge.all([this.message]);
      this.allChatsArray.unshift(messageCopy);
      this.getVisibleMessagesForSelectedFriend();
      this.base.getAllMessagesSubject.next({
        allChatsArray: this.allChatsArray,
      });
      res('Üzenet tulajdonságai beállítva, üzenet objektum lemásolva.');
    }).then(res => {
      this.base.updateMessage(this.message['key'], this.message).then(() => {
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
        this.message = new Chat();
        console.log(res, 'Sikeres üzenetfelvitel az adatbázisba.');
      });
    });
    this.sendMessNotifications();
  }

  // updateSeenMessages() {
  //   // látott üzenetek kiszűrése a tömbből
  //   this.allChatsArray = this.allChatsArray?.map(mess => {
  //     if (mess.message.senderId === this.selectedFriendId) {
  //       mess.message.seen = true;
  //       this.base.updateMessage(mess.key, mess);
  //       return mess;
  //     }
  //     if (mess.message.senderId !== this.selectedFriendId) {
  //       return mess;
  //     }
  //   });

  // this.haventSeenMessagesArr = this.haventSeenMessagesArr?.filter(
  //   mess => mess !== undefined
  // );
  // this.utilService.filterShowFriendsMessArr(
  //   this.haventSeenMessagesArr,
  //   this.showFriendsMess
  // );
  // this.utilService.subjectValueTransfer(
  //   this.haventSeenMessagesArr,
  //   this.base.newMessageNotiSubject
  // );
  // this.runMessagesSubjectValueTransfer();
  // }

  // updateSeenMessagesAndViewTime = (user: any) => {
  //   return new Promise((res, rej) => {
  //     this.updateSeenMessages();
  //     res('');
  //   }).then(res => {
  //     /////////////////// LEÍRÁS ////////////////////////
  //     // Mikor írta az üzenetet beállítása a calcMinutesPassed() //
  //     // metódus segítségével(formázva)) //
  //     this.allChatsArray = this.allChatsArray.map(mess => {
  //       if (!mess.message.viewTimeStamp || mess.message.viewTimeStamp == '') {
  //         mess.message.viewTimeStamp = this.utilService.calcMinutesPassed(
  //           mess.message.timeStamp
  //         );
  //       }
  //       // az iteráció végén visszaad minden üzenetet(módosítva)
  //       return mess;
  //     });
  //   });
  // };

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

  sendMessNotifications() {
    const apiUrl = 'https://us-central1-project0781.cloudfunctions.net/api/';

    const msg: Notification = {
      displayName: this.message.message.displayName,
      message: this.message.message.message,
      profilePhoto: this.message.message.profilePhoto,
      timeStamp: this.message.message.timeStamp,
      senderId: this.userProfile.uid,
    };

    new Promise((res, rej) => {
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
    // let recordedAudio: Blob;
    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      this.audioChunks.push(event.data);
      // recordedAudio = new Blob(this.audioChunks, { type: 'audio/x-m4a' });
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
      // console.log(recordedAudioFile);
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
    this.convertVideo(this.selectedFiles);
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

    this.firestore.filesSubject.subscribe((file: any) => {
      this.filesArr.push(file);
      console.log(this.filesArr);
      if (file.fileName.includes(this.selectedFriend.displayName)) {
        this.message.message.voiceMessage = file.url;
        this.message.message.message = '';
      }
    });
  }

  convertVideo(videoFiles: any[]) {
    const videoBlob = new Blob(videoFiles, { type: videoFiles[0].type });
    console.log(videoBlob);
    this.http
      .post(Environments.API_URL + 'video-compressing', {
        videoBuffer: videoBlob,
      })
      .subscribe(res => console.log(res));
  }

  generateNameForFile(fileFormat: string) {
    const timeId = new Date().getTime();
    const fileName =
      this.selectedFriend.displayName + '_' + timeId + '.' + fileFormat;
    return fileName;
  }

  getVisibleMessagesForSelectedFriend(): any[] {
    console.log(this.allChatsArray);
    this.allChatsArray.map(mess => {
      if (
        !mess.message?.seen &&
        mess.message.senderId === this.selectedFriendId
      ) {
        mess.message.seen = true;
        this.base.updateMessage(mess.key, mess).then(() => {});
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
        !this.urlText.includes(mess.key) &&
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
        !this.urlText.includes(mess.key)
      ) {
        this.urlText.push(
          { url: mess.message?.message, chatId: mess.key },
          mess.key
        );
      }
    });
    return this.visibleMessages;
  }

  getNewMessages() {
    const userProfile = this.userProfile;
    return this.base.getNewMessages().subscribe(mess => {
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
        msg.message.viewTimeStamp = this.utilService.calcMinutesPassed(
          new Date(msg.message.timeStamp)
        );
        if (
          msg.participants[1] === userProfile?.uid &&
          msg.message.senderId === this.selectedFriendId
        ) {
          this.allChatsArray.unshift(msg);
        }
      }
      // if (this.userMessages) this.updateSeenMessages();
      // this.runMessagesSubjectValueTransfer();
      this.getVisibleMessagesForSelectedFriend();
    });
  }

  backToUsers() {
    this.sendPrivateMessageOn = false;
    // this.isMessageOn = false;
    // this.firestore.filesSubject.unsubscribe();
    // this.filesArr = [];
    // this.firestore.filesSubject = new Subject();
    this.urlText = [];
    this.haventSeenMessagesArr = this.haventSeenMessagesArr.filter(
      mess => !mess.message.seen
    );
    this.showFriendsMess = this.utilService.filterShowFriendsMessArr(
      this.haventSeenMessagesArr,
      this.showFriendsMess
    );
    this.base.getAllMessagesSubject.next({
      haventSeenMessagesArr: this.haventSeenMessagesArr,
      allChatsArray: this.visibleMessages,
      showFriendsMess: this.showFriendsMess,
    });
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
      // showFriendsMess: this.showFriendsMess,
    });
  }

  ngOnDestroy(): void {
    if (this.getAllMessagesSubjectSub)
      this.getAllMessagesSubjectSub.unsubscribe();
    if (this.messSubscription) {
      this.messSubscription.unsubscribe();
    }
    if (this.filesBehSubjectSub) this.filesBehSubjectSub.unsubscribe();
  }
}
