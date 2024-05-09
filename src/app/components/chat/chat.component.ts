import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
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
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild(MatAccordion) accordion!: MatAccordion;

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
  friendsOn: boolean = false;

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

  // FÁJLOKKAL KAPCSOLATOS //
  selectedFiles: any[] = [];
  filesArr: any[] = [];
  sentFilesArr: any[] = [];
  uploadFinished: boolean = true;

  // PUSH NOTIFICATIONS-EL KAPCSOLATOS //
  friendPushSub: any;
  myPushSubscription: any;

  // TOAST //
  toastVal: any = {};

  // SUBJECTHEZ //
  authNull = 2;

  // FELIRATKOZÁSOK //
  userLoggedInSubscription!: Subscription;
  isSuperAdminSubscription!: Subscription;
  usersSubscription!: Subscription;
  userFriendSubjectSub!: Subscription;
  getAllMessagesSubjectSub!: Subscription;
  filesBehSubjectSub!: Subscription;
  haventSeenMsgsArrSubjSub!: Subscription;
  messSubscription!: Subscription;

  constructor(
    private auth: AuthService,
    private base: BaseService,
    private router: Router,
    private ngbModal: NgbModal,
    private firestore: FirestoreService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // if(!this.friendPushSub) {
    //   this.auth.swPushh().subscribe(sub => {
    //     this.friendPushSub = sub
    //     console.log(this.friendPushSub)
    //   });
    // }
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
                res('Sikeres felhasználói profil lekérés');
              }
            });
        });
    }).then(res => {
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
              console.log('fájlok lekérve forEachben');
            });
            console.log('fájlok lekérve');
            this.firestore.filesBehSubject.next(this.sentFilesArr);
          });
      }
      // baratok listajanak lekerese
      this.getFriendsAndNotFriends().then((res: any) => {
        this.base.profileSeenSubject.next(this.userFriends);
        console.log(res);
        // új üzenetek lekérése
        this.messSubscription = this.getNewMessages();
      });
    });
    this.isSuperAdminSubscription = this.auth.isSuperAdmin.subscribe(
      value => (this.isSAdmin = value)
    );
  }

  ////////////////////// LEÍRÁS ///////////////////////////
  // Ismerősök és nem ismerősök lekérése, beállítása //
  getFriendsAndNotFriends() {
    return new Promise(res => {
      this.base.getFriends()?.subscribe(frs => {
        this.friendsOn = true;
        this.userProfile.friends = frs;
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
          // const userFriendsIds = userProfileCopy.friends?.map(
          //   fr => fr.friendId
          // )
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
              !friendsUids.includes(item.uid) &&
              item.uid !== this.userProfile.uid
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
        }
        res('Sikeres barátok listája lekérés');
      });
    });
  }

  signAsAFriend(user: UserClass) {
    const friend: {} = {
      friendId: user.uid,
    };
    this.base.addFriends(friend)?.then(() => {
      const modalRef = this.ngbModal.open(ModalComponent, {
        centered: true,
      });
      modalRef.componentInstance.friendName = user.displayName;
      this.toastVal = user;
      modalRef.componentInstance.name = 'Ismerősnek jelölve.';
      this.base.userFriendsSubject.next({});
      this.getFriendsAndNotFriends().then(() => {
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
      this.getFriendsAndNotFriends().then(() => {
        this.filterShowFriendsMessArr();
        this.base.getAllMessagesSubject.next({
          showFriendsMess: this.showFriendsMess,
        });
      });
    });
  }

  toUserProfile() {
    this.isUserProfileOn = true;
    this.router.navigate([`profile/${this.userProfile.uid}`]);
  }

  getMessageUser(user: any, i: number) {
    this.selectedFriend = user; // objektum
    this.sendPrivateMessageOn = true;
    this.userMessages = true;
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
        console.log('if ág lefutott', formattedText1stHalf);
        console.log('if ág lefutott', formattedText2ndHalf);
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
        console.log('else if ág lefutott', i);
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
    this.haventSeenMessagesArr = this.haventSeenMessagesArr?.map(mess => {
      if (mess.message.senderId === this.selectedFriend.friendId) {
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
            msg.message.senderId != this.userProfile.uid &&
            msg.participants[1] === this.userProfile.uid
        );
      }

      for (let msg of msgArr) {
        msg.message.viewTimeStamp = this.calcMinutesPassed(
          new Date(msg.message.timeStamp)
        );
        // const participants0Uid = msg.participants[0].split('-').shift();
        if (msg.participants[1] === this.userProfile.uid) {
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
    let tomb: any = [];
    const lastIndex = this.selectedFiles.length - 1;
    console.log(this.selectedFiles.length);
    this.selectedFiles.map((file: any, ind: number) => {
      const promise = this.firestore
        .addFilesFromMessages(this.userProfile, file)
        ?.then((val: any) => {
          tomb.push(val.metadata.name);
          console.log(val.metadata.name);
          if (tomb.length === this.selectedFiles.length) {
            console.log(tomb, 'siker');
            this.selectedFiles = [];
            const fileModal = this.ngbModal.open(FilesModalComponent, {
              centered: true,
            });
            fileModal.componentInstance.uploadTrue = true;
            this.uploadFinished = true;
          }
        })
        .catch(err => {
          tomb.push('Meglévő fájl');
          console.log('Már van ilyen fájl az adatbázisban');

          if (tomb.length === this.selectedFiles.length) {
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
      console.log(this.filesArr);
    });
  }

  addMessage() {
    new Promise((res, rej) => {
      const actualTime = new Date().toLocaleString();
      if (this.userProfile.uid)
        this.message.message.senderId = this.userProfile.uid;
      this.message.message.timeStamp = actualTime;
      this.message.participants[0] =
        this.userProfile.uid + '-' + new Date().getTime();
      this.message.participants[1] = this.selectedFriend.friendId;
      this.message.participants[2 as any] =
        this.userProfile.uid +
        this.selectedFriend.friendId +
        '-' +
        new Date().getTime();
      this.message.message.displayName = this.userProfile.displayName;
      this.message.message.email = this.userProfile.email as string;
      this.message.message.profilePhoto = this.userProfile.profilePicture;
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
    let myPushSubscription: PushSubscription = this.auth.swPushh();
    if (myPushSubscription) {
      let JSONed = myPushSubscription.toJSON();
      this.firestore
        .getUserNotiSubscriptionReformed(this.userProfile.key, JSONed.endpoint!)
        .then(docs => {
          if (docs.empty)
            this.firestore.saveUserNotiSubscription(
              this.userProfile.key,
              JSONed
            );
          docs.forEach(doc => {
            if (!doc.exists)
              this.firestore.saveUserNotiSubscription(
                this.userProfile.key,
                JSONed
              );
          });
        });
    }
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

  toFriendProfile(friendId: string) {
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
          (f: any) => f.friendId === this.userProfile.uid
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
      this.router.navigate(['chat/' + friendId + '/friend-profile'])
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
  }
}
