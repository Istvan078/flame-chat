import { inject, Injectable } from '@angular/core';
import { ForUserSubject, Friends, UserClass } from '../models/user.model';
import { AuthService } from './auth.service';
import { BaseService } from './base.service';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';
import { Form } from '../models/utils/form.model';
import deepmerge from 'deepmerge';
import { Chat } from '../models/chat.model';

interface AllUserDetails {
  userProfiles: UserClass[];
  userProfile: UserClass;
  userProfilesUidsArr: string[];
  userFriends?: Friends[];
}

@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  private auth = inject(AuthService);
  private base = inject(BaseService);
  userProfile: UserClass = new UserClass();
  userProfiles: UserClass[] = [];
  forUserSubject: ForUserSubject = new ForUserSubject();
  userFriends: Friends[] = [];
  userNotFriends: UserClass[] = [];
  userSubject: BehaviorSubject<any> = new BehaviorSubject([]);
  friendsUids: string[] = [];
  signedAsFriendUids: string[] = [];
  userProfilesUidsArr: string[] = [];
  loadingSubject: Subject<any> = new Subject();
  postsFormData: Form[] = [
    {
      label: 'Név',
      matIcon: 'person',
      input: {
        formControlName: 'name',
      },
    },
    {
      textArea: true,
      label: 'Bejegyzés szövege',
      input: { formControlName: 'message' },
    },
    {
      label: 'Youtube link',
      input: { formControlName: 'iFrame' },
    },
  ];
  constructor() {}

  async getUserProfiles(): Promise<Observable<AllUserDetails>> {
    const user = await this.auth.getUser();
    return <any>this.base.getUserProfiles().pipe(
      map((uProfs: any[]) => {
        this.userProfiles = uProfs;
        this.userProfilesUidsArr = this.userProfiles.map(uP => uP.uid);
        const userProfile = uProfs.filter(uP => uP.uid === user.uid);
        Object.assign(this.userProfile, ...userProfile);
        // if (this.userProfile?.friends?.length)
        this.userFriends = Object.values(this.userProfile?.friends as any);
        this.setUserFriendsArray(this.userFriends);
        this.setUserNotFriendsArr();
        return {
          userProfiles: this.userProfiles,
          userProfilesUidsArr: this.userProfilesUidsArr,
          userProfile: this.userProfile,
          userFriends: this.userFriends,
        };
      })
    );
  }

  setUserFriendsArray(userFriends: Friends[]) {
    this.userFriends = userFriends
      .map(fr => {
        const friendProf = this.userProfiles.find(uP => fr.friendId === uP.uid);
        if (fr.seenMe === undefined) {
          fr.seenMe = false;
          this.base.updateFriend(
            (fr as any).key,
            {
              seenMe: fr.seenMe,
            } as any,
            this.userProfile.key
          );
        }
        // //////////////////// LEÍRÁS ///////////////////
        // // baratok kiszűrése //
        if (fr.confirmed || fr.areFriends !== false) {
          (fr.displayName = friendProf?.displayName),
            (fr.profilePicture = friendProf?.profilePicture),
            (fr.email = friendProf?.email),
            (fr.online = friendProf?.online);
          fr.lastTimeOnlineUnix = friendProf?.lastTimeOnline
            ? (fr.lastTimeOnlineUnix = friendProf?.lastTimeOnline)
            : 0;
          if (!this.friendsUids.includes(fr.friendId))
            this.friendsUids.push(fr.friendId);
        } else this.signedAsFriendUids.push(fr.friendId);
        return fr;
      })
      .filter(fr => fr?.confirmed !== false && fr.areFriends !== false)
      .sort((a: any, b: any) => b.lastTimeOnlineUnix - a.lastTimeOnlineUnix);
  }

  setUserNotFriendsArr() {
    // //////////////////// LEÍRÁS ///////////////////
    // // nem baratok kiszűrése //
    const userProfilesCopy = deepmerge(this.userProfiles, []);
    this.userNotFriends = userProfilesCopy
      .filter(
        uP =>
          !this.friendsUids.includes(uP.uid) &&
          uP.uid !== this.userProfile.uid &&
          !this.signedAsFriendUids.includes(uP.uid)
      )
      .map((uP: any) => {
        uP.friendId = uP.uid;
        uP.friendKey = uP.key;
        delete uP.key;
        delete uP.uid;
        return uP;
      });

    this.signedAsFriendUids = [];
    this.friendsUids = [];
    this.forUserSubject.userFriends = this.userFriends;
    this.forUserSubject.userNotFriends = this.userNotFriends;
  }

  getFriends() {
    return this.base.getFriends(this.userProfile.key).pipe(
      map(val => {
        console.log(`****GET FRIENDS LEFUTOTT****`);
        if (val.length) this.userFriends = val;
        if (this.userFriends.length) {
          this.setUserFriendsArray(this.userFriends);
          this.setUserNotFriendsArr();
          this.userSubject.next(this.forUserSubject);
        }
      })
    );
  }

  getFriendsForNotifUpdate() {
    return this.base.getFriends(this.userProfile.key)?.pipe(
      map(frs => {
        console.log(`**GetFriendsForNotiUpdate**`);
        const friends = frs;
        let friendProfile: any = {};
        const seenMeArr = friends
          ?.filter(f => {
            return f.seenMe === true;
          })
          ?.map((fr, i, arr) => {
            friendProfile = this.userProfiles.find(
              uP => uP.uid === fr.friendId
            );
            const friend = Object.assign({}, ...arr);
            friend.displayName = friendProfile?.displayName;
            friend.profilePicture = friendProfile?.profilePicture;
            friend.email = friendProfile?.email;
            friend.friendKey = fr.friendKey;
            return friend;
          });
        return seenMeArr;
      })
    );
  }

  /////////////////////// LEÍRÁS //////////////////////////////
  // A ShowFriendsMessArr tömb értékeit állítja be //
  // új üzenetnél és mikor elolvassuk az üzenetet //
  filterShowFriendsMessArr(
    haventSeenMessagesArr: any[],
    showFriendsMess: any[]
  ) {
    // a nemlátott üzenetek tömböt iterálja, kiszűri a baráttól való
    // eddig nem láttott üzeneteket és kap egy
    // seen:false property-t + az adott barát összes többi tulajdonságát
    const messSenderIds = haventSeenMessagesArr?.map(
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

    showFriendsMess = filteredFriendsArr;
    return showFriendsMess;
  }

  getFormDataForPosts() {
    return this.postsFormData;
  }

  resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number
  ): Promise<Blob> {
    return new Promise((res, rej) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = e => {
        img.src = e.target?.result as string;
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          blob => {
            if (blob) {
              res(blob);
            } else rej(new Error('A vászon üres'));
          },
          'image/jpg',
          quality
        );
      };
      reader.onerror = error => {
        rej(error);
      };
      reader.readAsDataURL(file);
    });
  }

  randomIdGenerator(message?: Chat) {
    const idString = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let chatId = 'chat_id_';
    let friendId = 'friend_id_';
    for (let i = 0; i <= 8; i++) {
      if (message?.message.timeStamp) {
        chatId += idString.charAt(Math.round(Math.random() * 30));
      } else {
        friendId += idString.charAt(Math.round(Math.random() * 30));
      }
    }
    if (message?.message.timeStamp) return '_' + chatId;
    else return friendId;
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
}
