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
  msgThemes: any[] = [];
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
  isUserOnlineNow: boolean = true;

  // ESEMÉNYFIGYELŐK //
  private isOnlineHandler: () => void;
  private isOfflineHandler: () => void;
  constructor() {
    this.isOnlineHandler = this.handleOnline.bind(this);
    this.isOfflineHandler = this.handleOffline.bind(this);
    this.isUserOnline();
  }

  async getUserProfiles(): Promise<Observable<AllUserDetails>> {
    const user = await this.auth.getUser();
    return <any>this.base.getUserProfiles().pipe(
      map((uProfs: any[]) => {
        this.userProfiles = uProfs;
        this.userProfilesUidsArr = this.userProfiles.map(uP => uP.uid);
        const userProfile = uProfs.filter(uP => uP.uid === user.uid);
        Object.assign(this.userProfile, ...userProfile);
        if (this.userProfile?.friends)
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
    const friendsWithNewMess: any[] = [];
    let filteredFriendsArr = allFriendsAndNMessFromArr.filter((fr, i) => {
      if (fr?.newMessageNumber) {
        friendsWithNewMess.push(fr);
      }
      // Ha ez az első alkalom, hogy találkozunk ezzel a friendId-val, akkor visszatérünk igazzal, hogy a barát objektumot a szűrt tömbbe tegyük
      if (!seenFriendIds[fr.friendId]) {
        seenFriendIds[fr.friendId] = true;
        return true;
      }
      return false;
    });
    filteredFriendsArr = filteredFriendsArr.filter(fr => !fr.newMessageNumber);
    filteredFriendsArr.unshift(...friendsWithNewMess);
    showFriendsMess = filteredFriendsArr;
    console.log('***ISMERŐS ÜZENETFEJEK SZŰRVE(FSM)***');
    return showFriendsMess;
  }

  getFormDataForPosts() {
    return this.postsFormData;
  }

  async handleOnline() {
    if (!this.isUserOnlineNow) {
      await this.base.updateUserData({ online: true }, this.userProfile?.key);
      this.isUserOnlineNow = true;
    }
  }

  async handleOffline() {
    if (this.isUserOnlineNow) {
      await this.base.updateUserData({ online: false }, this.userProfile?.key);
      await this.base.updateUserData(
        { lastTimeOnline: new Date().getTime() },
        this.userProfile?.key
      );
      this.isUserOnlineNow = false;
    }
  }

  async isUserOnline() {
    // A FELHASZNÁLÓ ONLINE-E ESEMÉNYFIGYELŐK //
    window.addEventListener('click', this.isOnlineHandler);
    window.addEventListener('focus', this.isOnlineHandler);
    // A FELHASZNÁLÓ OFFLINE-E ESEMÉNYFIGYELŐ //
    window.addEventListener('blur', this.isOfflineHandler);
    setInterval(async () => {
      console.log(`LEFUTSZ_E???`);

      if (this.isUserOnlineNow) {
        const minutes = new Date().getMinutes();
        const lastTimeOnline = new Date(
          this.userProfile?.lastTimeOnline!
        ).getMinutes();
        if (minutes - lastTimeOnline >= 3) {
          await this.base.updateUserData(
            { online: false },
            this.userProfile?.key
          );
          console.log('VOLT ELÉRHETŐ');
          this.isUserOnlineNow = false;
        }
        // await this.base.updateUserData(
        //   { online: false },
        //   this.userProfile?.key
        // );
        // await this.base.updateUserData(
        //   { lastTimeOnline: new Date().getTime() },
        //   this.userProfile?.key
        // );
      }
    }, 10 * 1000);
  }

  //////////////// KÉPÚJRAMÉRETEZŐ FUNKCIÓ ////////////////////
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

  ////////// CHATEKHEZ ÉS BARÁT AZONOSÍTÓHOZ ID GENERÁLÓ FUNKCIÓ ////////////
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

  setReactionsArr() {
    const reactions = [
      {
        reactionIcon: '😂',
        reactionName: 'vicces 😂',
        bgColor: 'rgba(183, 84, 188, 1)',
        color: 'rgba(183, 84, 188, 1)',
      },
      {
        reactionIcon: '👍',
        reactionName: 'tetszik 👍',
        bgColor: 'rgba(63, 76, 176, 1)',
        color: 'rgba(63, 76, 176, 1)',
      },
      {
        reactionIcon: '😢',
        reactionName: 'szomorú 😢',
        bgColor: 'rgba(234, 240, 117, 1)',
        color: 'rgb(169, 120, 21)',
      },
      {
        reactionIcon: '❤️',
        reactionName: 'imádom ❤️',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },
      {
        reactionIcon: '😡',
        reactionName: 'dühítő 😡',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },
      {
        reactionIcon: '😊',
        reactionName: 'elpirult 😊',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },
    ];
    return reactions;
  }
  getMsgThemes() {
    return (this.msgThemes = [
      {
        url: 'https://img.freepik.com/free-photo/vertical-aerial-shot-clouds-forest_181624-2570.jpg?t=st=1737474214~exp=1737477814~hmac=4158899e6efa97dd6b0375e282a4bd26bc8d93963af25adc5d6c99045c55fbfd&w=740',
        name: 'Ködös erdő',
      },
      {
        url: 'https://img.freepik.com/free-photo/vertical-shot-foamy-waves-coming-sandy-beach-beautiful-blue-sky_181624-7667.jpg?t=st=1737559170~exp=1737562770~hmac=6dca86ff5daf4ed0334d1b136c9bd1a77c2b694a46a5e2517e4fcbc7b5f9a224&w=740',
        name: 'Tenger',
      },
      {
        url: 'https://img.freepik.com/free-photo/space-background-realistic-starry-night-cosmos-shining-stars-milky-way-stardust-color-galaxy_1258-153810.jpg?t=st=1737559315~exp=1737562915~hmac=a5cfda45d16dd929913dc8ff0bfe64531f02d030f9b2cc4585c9136b4d9ad79d&w=1380',
        name: 'Univerzum',
      },
      {
        url: 'https://img.freepik.com/free-photo/relationship-concept-with-red-heart-wooden-cubes-wooden-table-side-view_176474-9500.jpg?t=st=1737470112~exp=1737473712~hmac=a0bf5168982ead3ad2f319c2254a3f4850d964ad84d2125554b398e3085a44b3&w=1380',
        name: 'Szerelem-1',
      },
      {
        url: 'https://img.freepik.com/free-photo/beautiful-valentine-s-day-concept_23-2148741360.jpg?t=st=1737559646~exp=1737563246~hmac=71e96b06ad033c86d1a836c2b391390701fb33bd112b50bc0a63a5cf7840228f&w=740',
        name: 'Szerelem-2',
      },
      {
        url: 'https://img.freepik.com/free-photo/heart-magenta-crystals_23-2147749434.jpg?t=st=1737559714~exp=1737563314~hmac=50206fc0f0e82c12078764a8b6c0b3a5df3fdbccb58b79de8b39d8cbc972cb35&w=1060',
        name: 'Szerelem-3',
      },
      {
        url: 'https://img.freepik.com/free-photo/view-heart-shaped-balloon-floating-city_23-2150824974.jpg?t=st=1737559490~exp=1737563090~hmac=ddfb55ead379c288d474548bd26a91cca589ddf5c98b504c237fae817dc293ee&w=740',
        name: 'Szív',
      },
      {
        url: 'https://img.freepik.com/free-photo/spring-scene-with-flowers-butterfly_23-2150169999.jpg?t=st=1737474310~exp=1737477910~hmac=158e26aad913c04857b1e0b50e8c2beb8fa6136aa500b38c604f322cc006169a&w=740',
        name: 'Pipacs',
      },
      {
        url: 'https://img.freepik.com/free-photo/brown-gray-rocky-mountain-white-cloudy-sky-daytime_414077-83.jpg?t=st=1737474528~exp=1737478128~hmac=a0d533ca97898e5a7845fb1aab4f7a9d5e8e35de8efa3becbb4dfc735e133083&w=740',
        name: 'Hegy',
      },
      {
        url: 'https://img.freepik.com/free-photo/young-sports-lady-beach-make-meditation-exercises_171337-14858.jpg?t=st=1737558666~exp=1737562266~hmac=8eff30a19b1bceeff18f04258ace0940ec5780facaa6399a8e6fcf299ff4e55d&w=1380',
        name: 'Meditáció',
      },
    ]);
  }
}
