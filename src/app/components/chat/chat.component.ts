import { ViewportScroller } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AngularFireDatabase,
  AngularFireList,
} from '@angular/fire/compat/database';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { Chat } from 'src/app/models/chat.model';
import { Friends, UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { MatAccordion } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modals/modal/modal.component';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FilesModalComponent } from '../modals/files-modal/files-modal.component';
import { AnyCatcher } from 'rxjs/internal/AnyCatcher';
import { HttpClient } from '@angular/common/http';

type Friend = {
  friendId: string;
};

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
  @ViewChild('toastHeader') toastHeader!: ElementRef;

  toastVal: any = {};

  users: Chat[] = [];
  signAsFriend: UserClass = new UserClass();
  isSAdmin: boolean = false;
  message: Chat = new Chat();
  updateUserMessage: Chat = new Chat();
  messages: Chat[] = [];
  editMessage: boolean = false;
  friendsOn: boolean = false;
  sendPrivateMessageOn: boolean = false;
  updateMessageKey: string = '';
  userObject!: UserClass;
  userProfiles: UserClass[] = [];
  userProfile: UserClass = new UserClass();
  count: number = 0;
  searchWord: string = '';
  refFriends!: AngularFireList<UserClass>;
  eredmeny: any;
  isFriend: boolean = false;
  messageButtonsOn: boolean = false;
  messageButtonClicked: boolean = false;
  isUserProfileOn: boolean = false;

  friendsUserProfArr: any[] = [];
  removedFriend: boolean = false;

  allChatsArray: any[] = [];
  userMessages: boolean = false;
  haventSeenMessagesArr?: any[] = [];
  messFromSelFriendArr: any[] = [];
  showFriendsMess: any[] = [];
  seenMeArr: any[] = [];

  userNotFriends: any[] = [];
  userFriends?: Friends[] = [];

  signedFriend: Friend = {
    friendId: '',
  };

  selectedFriend: any = {};
  selectedFiles: any[] = [];
  filesArr: any[] = [];
  sentFilesArr: any[] = [];

  uploadFinished: boolean = true;

  authNull = 2;

  msgCount = 0;

  userLoggedInSubscription!: Subscription;
  isSuperAdminSubscription!: Subscription;
  usersSubscription!: Subscription;
  userFriendSubjectSub!: Subscription;
  getAllMessagesSubjectSub!: Subscription;
  filesBehSubjectSub!: Subscription;
  haventSeenMsgsArrSubjSub!: Subscription;

  friendPushSub: any;
  myPushSubscription: any;

  constructor(
    private realTimeDatabase: AngularFireDatabase,
    private auth: AuthService,
    private base: BaseService,
    private viewPortScroller: ViewportScroller,
    private router: Router,
    private _snackbar: MatSnackBar,
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
    this.auth.authNullSubject.subscribe((authNull) => {
      this.authNull = authNull;
    });
    if (
      Object.keys(this.base.userFriendsSubject.getValue()).length !== 0 &&
      !this.userFriends?.length
    ) {
      this.userFriendSubjectSub = this.base.userFriendsSubject.subscribe(
        (uFrs) => {
          this.userFriends = uFrs.userFriends;
          this.userNotFriends = uFrs.userNotFriends;
        }
      );
    }

    this.getAllMessagesSubjectSub = this.base.getAllMessagesSubject.subscribe(
      (obj) => {
        console.log(obj.allChatsArray);
        if (obj.allChatsArray) {
          this.allChatsArray = obj.allChatsArray;
        }
        console.log(obj.showFriendsMess);
        if (obj.showFriendsMess) {
          this.showFriendsMess = obj.showFriendsMess;
        }
        if (obj.haventSeenMessagesArr) {
          this.haventSeenMessagesArr = obj.haventSeenMessagesArr;
        }
      }
    );
    this.haventSeenMsgsArrSubjSub = this.base.haventSeenMsgsArr.subscribe(
      (hSMArr) => {
        this.haventSeenMessagesArr = hSMArr;
      }
    );
    new Promise((res) => {
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
              console.log(this.userProfile);
              if(this.userProfile && !this.userProfile.birthDate) {
                this.router.navigate(['profile/' + user.uid])
              }
              // userKey átadása base service-nek
              if (this.userProfile?.key) {
                this.base.userKeySubject.next(this.userProfile?.key);
                res('Sikeres felhasználói profil lekérés');
              }
            });
        });
    }).then((res) => {
      console.log(res);
      if (this.firestore.filesBehSubject.value.length === 0) {
        this.firestore
          .getFilesFromChat(this.userProfile.key as string)
          .subscribe((data: any) => {
            console.log('fájlok lekérve', data);
            this.sentFilesArr = data;
            this.firestore.filesBehSubject.next(this.sentFilesArr);
          });
      }
      // baratok listajanak lekerese
      this.getFriendsAndNotFriends().then((res: any) => {
        this.base.profileSeenSubject.next(this.userFriends);
        console.log(res);
        // chatek lekérése
        this.getAllMessages();
      });
    });
    this.isSuperAdminSubscription = this.auth.isSuperAdmin.subscribe(
      (value) => (this.isSAdmin = value)
    );
  }

  sendMessNotifications() {
    const apiUrl = 'https://us-central1-project0781.cloudfunctions.net/api/';
    let friend = this.userProfiles.find(
      (uP) => uP.uid === this.selectedFriend.friendId
    );
    let myPushSubscription: PushSubscription = this.auth.swPushh();
    if(myPushSubscription) {
      let JSONed = myPushSubscription.toJSON();
      this.firestore
      .getUserNotiSubscription(this.userProfile.key)
      .subscribe((mySub) => {
        let subInDatabase = [];
        subInDatabase = mySub.filter(
          (sub: any) => sub.endpoint === JSONed.endpoint
        );
        if (subInDatabase.length === 0) {
          this.firestore.saveUserNotiSubscription(this.userProfile.key, JSONed);
        }
      });
    }
    const msg: Notification = {
      displayName: this.message.message.displayName,
      message: this.message.message.message,
      profilePhoto: this.message.message.profilePhoto,
      timeStamp: this.message.message.timeStamp,
    };

    new Promise((res, rej) => {
      this.firestore.getUserNotiSubscription(friend!.key).subscribe((sub) => {
        this.friendPushSub = sub;
        if (this.friendPushSub !== undefined) {
          res(this.friendPushSub);
        }
      });
    }).then((pushSub) => {
      this.http
        .post(apiUrl + 'message', { msg: msg, sub: pushSub })
        .subscribe((res) => console.log(res));
    });
  }

  calcMinutesPassed(sentMessDate: any) {
    const newDate = new Date();
    const currPassedMinutesInMonth =
      newDate.getDate() * 24 * 60 +
      newDate.getHours() * 60 +
      newDate.getMinutes() -
      1440;
    sentMessDate =
      sentMessDate.getDate() * 24 * 60 +
      sentMessDate.getHours() * 60 +
      sentMessDate.getMinutes() -
      1440;
    const passedMinsSMessSent = currPassedMinutesInMonth - sentMessDate;

    let hours: number = 0;
    for (let i = 60; i < passedMinsSMessSent && i <= 1440; i += 60) {
      hours += 1;
    }

    let days: number = 0;
    for (let i = 1440;passedMinsSMessSent >= 1440 && i <= passedMinsSMessSent; i += 1440) {
      days += 1;
    }

    if (passedMinsSMessSent < 60)
      return `${passedMinsSMessSent} perccel ezelőtt írta`;

    if(hours < 24)
    return `${hours} órával ezelőtt írta`;
    
    if(hours >= 24)
    return `${days} nappal ezelőtt írta`;
  }

  getAllMessages() {
    if (
      Object.keys(this.base.getAllMessagesSubject.getValue()).length == 0 ||
      this.authNull === null ||
      this.authNull === 0
    ) {
      let myAllMessagesArr: any[] = [];
      let mySentMessgs: any[] = [];
      let msgsFFrArr: any[] = [];
      const myAllMessagesPromises: any = this.base.getUserMessages(
        this.userProfile.uid
      );
      console.log('lefutott az üzenetek lekérése');
      myAllMessagesPromises[0]
        .then((mySentMsgs: any) => {
          let mySentMessages = Object.assign({}, mySentMsgs);
          mySentMessgs = Object.values(mySentMessages);
        })
        .then(() => {
          myAllMessagesPromises[1].then((msgsFFr: any) => {
            let messagesFromFriends = Object.assign({}, msgsFFr);
            msgsFFrArr = Object.values(messagesFromFriends);
         });
        })
        .then(() => {
          myAllMessagesArr = [...mySentMessgs, ...msgsFFrArr];

          this.allChatsArray = myAllMessagesArr;
          this.haventSeenMessagesArr = msgsFFrArr.filter(
            (item) =>
              item.message.seen === false &&
              this.userProfile.uid === item.participants[1]
          );
          this.filterShowFriendsMessArr();
          if (this.showFriendsMess.length === 0) {
            this.showFriendsMess.push(this.userFriends?.length);
          }
          this.base.newMessageNotiSubject.next(this.haventSeenMessagesArr);
          this.base.getAllMessagesSubject.next({
            allChatsArray: this.allChatsArray,
            showFriendsMess: this.showFriendsMess,
            haventSeenMessagesArr: this.haventSeenMessagesArr,
          });
        });
    }
  }

  getNewMessage() {
    this.filterShowFriendsMessArr();
    this.base
      .getNewMessage()
      .then((jSM) => {
        console.log(jSM.val());
        let msgArr: any[] = [];
        if (jSM.val()) {
          const newMsgs = Object.values(jSM.val());
          msgArr = [...newMsgs];
          let keyArr: any[] = [];
          this.allChatsArray.map((jSM: any) => {
            keyArr.push(jSM.key);
          });
          console.log(keyArr);
          msgArr = msgArr.filter(
            (msg) => !keyArr.includes(msg.key) && msg.message.seen === false
          );

          console.log(msgArr);
        }
        return msgArr;
      })
      .then((msgArr) => {
        console.log(msgArr);

        for (let msg of msgArr) {
          console.log(msg);
          this.haventSeenMessagesArr?.push(msg);
          this.allChatsArray.unshift(msg);
          this.filterShowFriendsMessArr();
        }
        this.base.newMessageNotiSubject.next(this.haventSeenMessagesArr);
        this.base.getAllMessagesSubject.next({
          haventSeenMessagesArr: this.haventSeenMessagesArr,
          allChatsArray: this.allChatsArray,
          showFriendsMess: this.showFriendsMess,
        });
      });
  }

  getFriendsAndNotFriends() {
    return new Promise((res) => {
      this.base.getFriends()?.subscribe((frs) => {
        this.friendsOn = true;
        this.userProfile.friends = frs;

        let profile: any;
        const seenMeArr = this.userProfile.friends
          .filter((f) => {
            return f.seenMe === true;
          })
          .map((fr, i, arr) => {
            profile = this.userProfiles.find((uP) => uP.uid === fr.friendId);
            let obj = Object.assign({}, ...arr);
            obj.displayName = profile.displayName;
            obj.profilePicture = profile.profilePicture;
            obj.email = profile.email;
            obj.friendKey = fr.key;
            console.log(obj);
            return obj;
          });

        this.base.profileSeenSubject.next(seenMeArr);

        //  baratok tomb
        let friendsUids: any[] = [];
        let friendsTomb: any[] = [];

        const userProfilesCopy = [...this.userProfiles];
        const userProfileCopy = { ...this.userProfile };

        if (
          Object.keys(this.base.userFriendsSubject.getValue()).length === 0 ||
          this.authNull === null
        ) {
          userProfilesCopy.forEach((up) => {
            userProfileCopy.friends?.forEach((f) => {
              const prof = this.userProfiles.find(
                (uP) => f.friendId === uP.uid
              );
              if (f.seenMe === undefined) {
                f.seenMe = false;
                this.base.updateFriend(f.key, {
                  seenMe: f.seenMe,
                } as any);
              }
              friendsUids.push(f.friendId);
              if (up.uid === f.friendId) {
                friendsTomb.push({
                  friendKey: f['key'],
                  friendId: f.friendId,
                  seenMe: f.seenMe,
                  displayName: prof?.displayName,
                  profilePicture: prof?.profilePicture,
                  email: prof?.email,
                });
              }
            });
          });
        }

        //  nem baratok tomb
        if (
          Object.keys(this.base.userFriendsSubject.getValue()).length === 0 ||
          this.authNull === null
        ) {
          let userProf: any[] = this.userProfiles
            .map((uP) => uP)
            .filter(
              (item) =>
                !friendsUids.includes(item.uid) &&
                item.uid !== this.userProfile.uid
            );
          this.userNotFriends = userProf;
        }
        if (
          Object.keys(this.base.userFriendsSubject.getValue()).length === 0 ||
          this.authNull === null
        ) {
          this.userFriends = friendsTomb;
          console.log(this.userFriends)
          // subjecttel átküldi a userFriendst
          this.base.profileSeenSubject.next(this.userFriends);
          const forFriendsSubject = {
            userFriends: this.userFriends,
            userNotFriends: this.userNotFriends,
          };
          this.base.userFriendsSubject.next(forFriendsSubject);
          this.auth.authNullSubject.next(2);
        }
        res('Sikeres barátok listája lekérés');
      });
    });
  }

  selectedFs($event: any) {
    this.uploadFinished = false;
    this.selectedFiles = Array.from($event.target.files);
    console.log(this.selectedFiles.length);
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
        .catch((err) => {
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

  randomIdGenerator() {
    const idString = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let chatId = 'chat_id_';
    let friendId = 'friend_id_';
    for (let i = 0; i <= 7; i++) {
      if (this.message.message.timeStamp) {
        chatId += idString.charAt(Math.round(Math.random() * 30));
      } else {
        friendId += idString.charAt(Math.round(Math.random() * 30));
      }
    }
    if (this.message.message.timeStamp) return chatId;
    else return friendId;
  }

  toUserProfile() {
    this.isUserProfileOn = true;
    this.router.navigate([`profile/${this.userProfile.uid}`]);
  }

  fileModalOpen(picturesArr: [], i: number) {
    const modalRef = this.ngbModal.open(FilesModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.picturesArr = picturesArr;
    modalRef.componentInstance.viewIndex = i;
  }

  addMessage() {
    const actualTime = new Date().toLocaleString();
    this.message.message.senderId = this.userProfile.uid;
    this.message.message.timeStamp = actualTime;
    this.message.participants[0] = this.userProfile.uid;
    this.message.participants[1] = this.selectedFriend.friendId;
    this.message.message.displayName = this.userProfile.displayName;
    this.message.message.email = this.userProfile.email as string;
    this.message.message.profilePhoto = this.userProfile.profilePicture;
    this.message._setKey = this.randomIdGenerator();

    this.base.updateMessage(this.message['key'], this.message).then(() => {
      this.base.getJustSentMessage(this.message.key)?.then((jSMess: any) => {
        if (jSMess.val()) {
          let newMessIterator: any[] = [];
          newMessIterator = Object.values(jSMess.val());
          const [justSentMessObj] = [...newMessIterator];
          justSentMessObj.message.viewTimeStamp = this.calcMinutesPassed(
            new Date(justSentMessObj.message.timeStamp)
          );
          this.allChatsArray.unshift(justSentMessObj);
          this.base.getAllMessagesSubject.next({
            allChatsArray: this.allChatsArray,
          });
        }
      });
    });

    if (this.filesArr.length) {
      const selectedFriend = this.userProfiles.find(
        (usr) => usr.uid === this.selectedFriend.friendId
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

  getMessageUser(user: any) {
    this.selectedFriend = user; // objektum
    this.sendPrivateMessageOn = true;
    this.userMessages = true;
    const messFromSelFriendArr = this.allChatsArray.filter(
      (item) =>
        this.selectedFriend.friendId === item.message.senderId &&
        this.userProfile.uid === item.participants[1]
    );

    console.log(messFromSelFriendArr);

    const newTomb = [...messFromSelFriendArr];

    new Promise((res,rej) => {
      newTomb.map((mess) => {
        // if(mess.message.viewTimeStamp) {
        //   mess.message.viewTimeStamp = null
        //   this.base.updateMessage(mess['key'], mess)
        //   .then(()=> console.log('sikeres törlés'))
        // }
        if (mess.message.seen === false) {
          // const originalDate = new Date(mess.message.timeStamp)
  
          console.log(mess.message.timeStamp);
          // const unixTimeStamp = originalDate.getTime()
          // console.log(unixTimeStamp)
          // mess.message.timeStamp = unixTimeStamp
          mess.message.seen = true;
          this.base.updateMessage(mess['key'], mess).then(() => {
            this.haventSeenMessagesArr = this.haventSeenMessagesArr?.filter(
              (msg) => msg['key'] !== mess['key']
            );
            this.filterShowFriendsMessArr();
            this.base.newMessageNotiSubject.next(this.haventSeenMessagesArr);
            this.base.getAllMessagesSubject.next({
              //  allChatsArray: this.allChatsArray,
              showFriendsMess: this.showFriendsMess,
              haventSeenMessagesArr: this.haventSeenMessagesArr,
            });
          });
        }
      });
      res('Promise resolve ága lefutott')
    })
    .then((res) => {
      this.allChatsArray = this.allChatsArray.map((mess) => {
        // const postedMinutes = new Date(
        //   mess.message.timeStamp
        // ).to;
        if (!mess.message.viewTimeStamp || mess.message.viewTimeStamp == "") {
          const msgDate = new Date(mess.message.timeStamp);
          // console.log(msgDate);
          // console.log(mess.message.timeStamp);
          // console.log(d)
          mess.message.viewTimeStamp = this.calcMinutesPassed(msgDate);
          console.log(mess.message.viewTimeStamp)
          // mess.message.convertedToMins = true;
        }
  
        //  mess.message.timeStamp =
        return mess;
      });
    })
    // console.log(newTomb)



    this.filesBehSubjectSub = this.firestore.filesBehSubject.subscribe(
      (flArr) => (this.sentFilesArr = flArr)
    );

    this.sentFilesArr = this.sentFilesArr.filter((file) => {
      return (
        (file.receiverId === this.selectedFriend.friendId &&
          file.files.length !== 0) ||
        file.senderId === this.selectedFriend.friendId
      );
    });
    console.log('hello');
  }

  filterShowFriendsMessArr() {
    let tomb: any = this.haventSeenMessagesArr?.map((item) => {
      console.log(item.message.message);
      return this.userFriends
        ?.filter((friend) => friend.friendId === item.message.senderId)
        .map((friend) => ({ ...friend, seen: false }));
    });
    tomb = tomb.flat(1);
    console.log(this.userFriends);
    let ujTomb = [...tomb, ...this.userFriends!];
    const latottFriendIdk: any = {};
    const szurtObjektumokTomb = ujTomb.filter((obj, i) => {
      if (!latottFriendIdk[obj.friendId]) {
        latottFriendIdk[obj.friendId] = true;
        return true; // Ha ez az első alkalom, hogy találkozunk ezzel a friendId-val, akkor visszatérünk igazzal, hogy az objektumot a szűrt tömbbe tegyük
      }
      return false;
    });

    this.showFriendsMess = szurtObjektumokTomb;
  }

  clearInput() {
    this.message.message.message = '';
  }

  deleteMessage(message: Chat) {
    this.base.deleteMessage(message).then(() => {
      this.allChatsArray = this.allChatsArray.filter(
        (mess) => mess.key !== message.key
      );
    });
  }

  // getMessages() {
  //   return this.base.refChats
  //     .snapshotChanges()
  //     .pipe(
  //       map((changes) =>
  //         changes.map((c) => ({ key: c.payload.key, ...c.payload.val() }))
  //       )
  //     );
  // }

  deleteMessages() {
    this.base.deleteMessages();
  }

  backToUsers() {
    this.sendPrivateMessageOn = false;
    this.userMessages = false;
    this.firestore.filesSubject.unsubscribe();
    this.filesArr = [];
    this.firestore.filesSubject = new Subject();
    console.log(this.filesArr);
  }

  getFirstFiveMessagesForSelectedFriend(): any[] {
    // Kiszűröm a kiválasztott felhasználóhoz tartozó üzeneteket
    const selectedFriendMessages = this.allChatsArray.filter((message: any) => {
      return (
        (message.message.senderId === this.selectedFriend.friendId &&
          message.participants[1] === this.userProfile.uid) ||
        (message.message.senderId === this.userProfile.uid &&
          message.participants[1] === this.selectedFriend.friendId)
      );
    });

    selectedFriendMessages.map((mess) => {
      mess.message.timeStamp = new Date(mess.message.timeStamp).getTime()
    })

    selectedFriendMessages.sort((a: any, b: any) => {
      if (a.message.timeStamp < b.message.timeStamp) return 1;
      else return -1;
    });

    // Kiválasztom az első 5 üzenetet
    return selectedFriendMessages.slice(0, 5);
  }

  toFriendProfile(friendId: string) {
    const promise = new Promise((res, rej) => {
      const friendProfile = this.userProfiles.find((uP) => {
        return uP.uid === friendId;
      });
      // send friendprofilekey with subj
      this.base.userKeySubject.next(friendProfile?.key);
      console.log(friendProfile)
      if(friendProfile?.friends) {
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
        console.log(friendsArray)

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
      console.log(this.toastVal);
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
      console.log(this.toastHeader);
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
  }
}
