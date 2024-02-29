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
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { MatAccordion } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modals/modal/modal.component';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FilesModalComponent } from '../modals/files-modal/files-modal.component';

type Friend = {
  friendId: string;
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
  haventSeenMessagesArr: any[] = [];
  messFromSelFriendArr: any[] = [];
  showFriendsMess: any[] = [];
  seenMeArr: any[] = [];

  userNotFriends: any[] = [];
  userFriends: any[] = [];

  signedFriend: Friend = {
    friendId: '',
  };

  selectedFriend: any = {};
  selectedFiles: any[] = [];
  filesArr: any[] = [];
  sentFilesArr: any[] = [];

  uploadFinished: boolean = true;

  authNull = 2;

  userLoggedInSubscription!: Subscription;
  isSuperAdminSubscription!: Subscription;
  usersSubscription!: Subscription;
  userFriendSubjectSub!: Subscription;
  getAllMessagesSubjectSub!: Subscription;
  filesBehSubjectSub!: Subscription;

  constructor(
    private realTimeDatabase: AngularFireDatabase,
    private auth: AuthService,
    private base: BaseService,
    private viewPortScroller: ViewportScroller,
    private router: Router,
    private _snackbar: MatSnackBar,
    private ngbModal: NgbModal,
    private firestore: FirestoreService
  ) {}

  ngOnInit() {
    this.auth.authNullSubject.subscribe((authNull) => {
      this.authNull = authNull;
    });
    if (
      Object.keys(this.base.userFriendsSubject.getValue()).length !== 0 &&
      !this.userFriends.length
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
          // let [tomb] = [...mySentMessages]
          // mySentMessages.push(...mySentMsgs.val())
        })
        .then(() => {
          myAllMessagesPromises[1].then((msgsFFr: any) => {
            let messagesFromFriends = Object.assign({}, msgsFFr);
            msgsFFrArr = Object.values(messagesFromFriends);

            // let [tomb] = [...mySentMessages]
            // mySentMessages.push(...mySentMsgs.val())
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
            this.showFriendsMess.push(this.userFriends.length);
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
    this.base
      .getNewMessage()
      .then((jSM) => {
        let justSentM: any = {};
        const newMess: { key: string } = { key: '' };
        if (jSM.val()) {
          justSentM = Object.values(jSM.val());
          justSentM = justSentM.find((jSM: any) => jSM.key === jSM.key);
        }
        return { justSentM: justSentM, newMess };
      })
      .then((val) => {
        console.log(val);
        if (val.justSentM) {
          val.newMess = this.allChatsArray.find((ch) => {
            return ch.key === val.justSentM.key;
          });
        }
        if (val.newMess === undefined) {
          val.newMess = { key: 'új üzenet' };
        }

        if (val.justSentM) {
          if (val.newMess.key === 'új üzenet' && val.justSentM.key) {
            for (let ch of this.allChatsArray) {
              let vala = [];
              vala.push(val.justSentM);
              console.log(vala);
              this.haventSeenMessagesArr.push(val.justSentM);
              this.allChatsArray.unshift(val.justSentM);
              this.filterShowFriendsMessArr();
              break;
            }
          }
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

  fileModalOpen(picturesArr: [], i:number) {
    const modalRef = this.ngbModal.open(FilesModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.picturesArr = picturesArr;
    modalRef.componentInstance.viewIndex = i;
  }

  addMessage() {
    let actualTime = Date.now();
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
          let [toTimeStringObj] = [...newMessIterator];
          console.log(toTimeStringObj);
          toTimeStringObj.message.timeStamp = new Date(
            toTimeStringObj.message.timeStamp
          ).toLocaleString();
          this.allChatsArray.unshift(toTimeStringObj);
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
  }

  getMessageUser(user: any) {
    this.selectedFriend = user; // objektum
    this.sendPrivateMessageOn = true;
    this.userMessages = true;
    let messFromSelFriendArr = this.allChatsArray.filter(
      (item) =>
        this.selectedFriend.friendId === item.message.senderId &&
        this.userProfile.uid === item.participants[1]
    );
    this.allChatsArray.map((mess) => {
      mess.message.timeStamp = new Date(
        mess.message.timeStamp
      ).toLocaleString();
      return mess;
    });
    messFromSelFriendArr.forEach((mess) => {
      if (mess.message.seen === false) {
        mess.message.seen = true;
        this.base.updateMessage(mess['key'], mess).then(() => {
          this.haventSeenMessagesArr = this.haventSeenMessagesArr.filter(
            (msg) => msg['key'] !== mess['key']
          );
          this.filterShowFriendsMessArr();
          this.base.newMessageNotiSubject.next(this.haventSeenMessagesArr);
          this.base.getAllMessagesSubject.next({
            // allChatsArray: this.allChatsArray,
            showFriendsMess: this.showFriendsMess,
            haventSeenMessagesArr: this.haventSeenMessagesArr,
          });
        });
      }
    });

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
    let tomb: any = this.haventSeenMessagesArr.map((item) => {
      console.log(item.message.message);
      return this.userFriends
        .filter((friend) => friend.friendId === item.message.senderId)
        .map((friend) => ({ ...friend, seen: false }));
    });
    tomb = tomb.flat(1);
    console.log(this.userFriends);
    let ujTomb = [...tomb, ...this.userFriends];
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

  navigateToUpdateMessage(message: Chat) {
    this.updateUserMessage = message;
    console.log(this.updateUserMessage);
    this.updateMessageKey = message['key'] as string;
    console.log(this.updateMessageKey);
    this.editMessage = true;
    this.message.message.message = message.message.message;
    this.viewPortScroller.scrollToPosition([0, 0]);
  }

  updateMessage() {
    let actualTime = Date.now();
    // let dateString = date.toLocaleString();
    this.updateUserMessage.message.timeStamp = actualTime;
    this.updateUserMessage.message.message = this.message.message.message;
    this.base
      .updateMessage(this.updateMessageKey, this.updateUserMessage)
      .then(() => {
        this.base
          .getJustSentMessage(this.updateUserMessage.key)
          ?.then((jSMess: any) => {
            this.allChatsArray.push(...Object.values(jSMess.val()));
          });
      });
    this.viewPortScroller.scrollToAnchor(this.updateMessageKey);
    this.editMessage = false;
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
      let array = [...Object.entries(friendProfile!.friends)];
      let arr: any = array.flat();

      let newArr = [];
      let obj: any = {};
      for (let i = 0; i < arr.length; i++) {
        if (typeof arr[i] === 'string') {
          obj.key = arr[i];
        } else {
          obj.friendId = arr[i].friendId;
          newArr.push(obj);
          obj = {};
        }
      }
      const user: any = newArr.find(
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
    });

    promise.then(() =>
      this.router.navigate(['chat/' + friendId + '/friend-profile'])
    );

    // setTimeout(() => {
    //   this.router.navigate(['chat/' + friendId + '/friend-profile']);
    // }, 2000);
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
      });;
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
    if (this.userFriendSubjectSub) {
      this.userFriendSubjectSub.unsubscribe();
    }
    if (this.filesBehSubjectSub) {
      this.filesBehSubjectSub.unsubscribe();
    }
  }
}
