import { PeopleService } from 'src/app/features/people/people.service';
import { inject, Injectable } from '@angular/core';
import { ForUserSubject, Friends, UserClass } from 'src/app/features/people/user.model';
import { AuthService } from '../core/session/auth.service';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';
import deepmerge from 'deepmerge';
import { Chat } from '../features/messaging/chat.model';
import { TranslateService } from '@ngx-translate/core';

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
  private base = inject(PeopleService);
  private translate = inject(TranslateService);
  userProfile: UserClass = new UserClass();
  userProfiles: UserClass[] = [];
  forUserSubject: ForUserSubject = new ForUserSubject();
  userFriends: Friends[] = [];
  userNotFriends: UserClass[] = [];
  userSubject: BehaviorSubject<any> = new BehaviorSubject([]);
  friendsUids: string[] = [];
  signedAsFriendUids: string[] = [];
  userProfilesUidsArr: string[] = [];
  archFriendsUidsArr: string[] = [];
  loadingSubject: Subject<any> = new Subject();
  isUserOnlineNow: boolean = true;
  archivedFriends: any[] = [];

  constructor() {
    this.getUserProfiles().then(obs => {
      obs.subscribe(allUsrDtls => {
        this.userProfile = allUsrDtls.userProfile;
        this.userProfiles = allUsrDtls.userProfiles;
      });
    });
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
      }),
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
            this.userProfile.key,
          );
        }
        // //////////////////// LEÍRÁS ///////////////////
        // // baratok kiszűrése //
        const now = Date.now(); // mostani idő milliszekundumban
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        if (fr.confirmed || fr.areFriends !== false) {
          ((fr.displayName = friendProf?.displayName),
            (fr.profilePicture = friendProf?.profilePicture),
            (fr.email = friendProf?.email));
          if (friendProf?.lastTimeOnline)
            fr.online =
              friendProf?.lastTimeOnline < fiveMinutesAgo
                ? false
                : friendProf?.online;
          fr.lastTimeOnlineUnix = friendProf?.lastTimeOnline
            ? (fr.lastTimeOnlineUnix = friendProf?.lastTimeOnline)
            : 0;
          if (!this.friendsUids.includes(fr.friendId))
            this.friendsUids.push(fr.friendId);
        } else this.signedAsFriendUids.push(fr.friendId);
        if (fr?.archived && !this.archFriendsUidsArr.includes(fr.friendId)) {
          this.archFriendsUidsArr.push(fr.friendId);
          this.archivedFriends.push(fr);
        }
        return fr;
      })
      .filter(fr => fr?.confirmed !== false && fr.areFriends !== false);
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
          !this.signedAsFriendUids.includes(uP.uid),
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
    return this.base.getFriends(this.forUserSubject.userProfile.key).pipe(
      map(val => {
        console.log(`****GET FRIENDS LEFUTOTT****`);
        if (val.length) this.userFriends = val;
        if (this.userFriends.length) {
          this.setUserFriendsArray(this.userFriends);
          this.setUserNotFriendsArr();
          this.userSubject.next(this.forUserSubject);
        }
      }),
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
              uP => uP.uid === fr.friendId,
            );
            const friend = Object.assign({}, ...arr);
            friend.displayName = friendProfile?.displayName;
            friend.profilePicture = friendProfile?.profilePicture;
            friend.email = friendProfile?.email;
            friend.friendKey = fr.friendKey;
            return friend;
          });
        return seenMeArr;
      }),
    );
  }

  /////////////////////// LEÍRÁS //////////////////////////////
  // A ShowFriendsMessArr tömb értékeit állítja be //
  // új üzenetnél és mikor elolvassuk az üzenetet //
  filterShowFriendsMessArr(
    haventSeenMessagesArr: any[],
    showFriendsMess: any[],
  ) {
    // a nemlátott üzenetek tömböt iterálja, kiszűri a baráttól való
    // eddig nem láttott üzeneteket és kap egy
    // seen:false property-t + az adott barát összes többi tulajdonságát
    const messSenderIds = haventSeenMessagesArr?.map(
      mess => mess?.message?.senderId,
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
    console.log(this.archFriendsUidsArr);
    showFriendsMess = allFriendsAndNMessFromArr.filter((fr, i) => {
      if (
        (fr?.archived &&
          !this.archFriendsUidsArr.includes(fr.friendId) &&
          !fr?.newMessageNumber) ||
        (fr?.archivedAftNewMess &&
          !this.archFriendsUidsArr.includes(fr.friendId))
      ) {
        this.archivedFriends.push(fr);
        this.archFriendsUidsArr.push(fr.friendId);
      }
      this.forUserSubject.archivedFriends = this.archivedFriends;
      if (fr?.newMessageNumber && !fr?.archivedAftNewMess && !fr?.archived) {
        friendsWithNewMess.push(fr);
      }
      // Ha ez az első alkalom, hogy találkozunk ezzel a friendId-val, akkor visszatérünk igazzal, hogy a barát objektumot a szűrt tömbbe tegyük
      if (
        !seenFriendIds[fr.friendId] &&
        !this.archFriendsUidsArr.includes(fr.friendId)
      ) {
        seenFriendIds[fr.friendId] = true;
        return true;
      }
      return false;
    });
    console.log(showFriendsMess);
    friendsWithNewMess.sort((a, b) => b?.newMessSentTime - a?.newMessSentTime);
    const didntSendMsgToMeArr = showFriendsMess
      .filter(fr => !fr.newMessageNumber && !fr.newMessSentTime)
      .sort((a, b) => b.lastTimeOnlineUnix - a.lastTimeOnlineUnix);
    const sentMsgToMeArr = showFriendsMess
      .filter(mess => mess?.newMessSentTime && !mess?.newMessageNumber)
      .sort((a, b) => b.newMessSentTime - a.newMessSentTime);
    showFriendsMess = [...sentMsgToMeArr, ...didntSendMsgToMeArr];
    showFriendsMess.unshift(...friendsWithNewMess);
    console.log('***ISMERŐS ÜZENETFEJEK SZŰRVE(FSM)***');
    if (this.forUserSubject.archivedFriends?.length)
      this.subjectValueTransfer(this.forUserSubject, this.userSubject);
    console.log(showFriendsMess);
    return showFriendsMess;
  }

  async handleOnline() {
    if (!this.isUserOnlineNow) {
      await this.base.updateUserData(
        { online: true, lastTimeOnline: new Date().getTime() },
        this.userProfile?.key,
      );
      this.isUserOnlineNow = true;
    }
  }

  async handleOffline() {
    if (this.isUserOnlineNow) {
      await this.base.updateUserData(
        { online: false, lastTimeOnline: new Date().getTime() },
        this.userProfile?.key,
      );
      this.isUserOnlineNow = false;
    }
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
    const lang = localStorage.getItem('lang');
    const newDate = new Date().getTime();
    sentMessDate = new Date(sentMessDate).getTime();
    // A különbség milliszekundumokban
    const diffMilliseconds = newDate - sentMessDate;
    // A különbség percekben
    let passedMinsSMessSent: number = 0;
    if (Math.sign(diffMilliseconds) === -1) passedMinsSMessSent = 0;
    else passedMinsSMessSent = Math.floor(diffMilliseconds / 1000 / 60);
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
      return `${passedMinsSMessSent} ${this.translate.instant(
        'user.online.minutesAgo',
      )}`;

    if (hours < 24)
      return `${hours} ${this.translate.instant('user.online.hoursAgo')}`;

    if (hours >= 24)
      return `${days} ${this.translate.instant('user.online.daysAgo')}`;
  }

  getLanguage() {
    const lang = localStorage.getItem('lang');
    return lang === 'en' ? 'angol' : 'magyar';
  }

  setReactionsArr() {
    const reactions = [
      {
        reactionIcon: '🙂',
        reactionName: 'mosoly 🙂',
        bgColor: 'rgba(221, 197, 42, 1)',
        color: 'rgba(212, 170, 64, 1)',
      },
      {
        reactionIcon: '😄',
        reactionName: 'vidám 😄',
        bgColor: 'rgba(221, 197, 42, 1)',
        color: 'rgba(212, 170, 64, 1)',
      },
      {
        reactionIcon: '😁',
        reactionName: 'széles vigyor 😁',
        bgColor: 'rgba(221, 197, 42, 1)',
        color: 'rgba(212, 170, 64, 1)',
      },
      {
        reactionIcon: '😂',
        reactionName: 'vicces 😂',
        bgColor: 'rgba(183, 84, 188, 1)',
        color: 'rgba(183, 84, 188, 1)',
      },
      {
        reactionIcon: '😊',
        reactionName: 'elpirult 😊',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },

      {
        reactionIcon: '👍',
        reactionName: 'tetszik 👍',
        bgColor: 'rgba(63, 76, 176, 1)',
        color: 'rgba(63, 76, 176, 1)',
      },
      {
        reactionIcon: '😘',
        reactionName: 'puszit küld 😘',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },
      {
        reactionIcon: '🥰',
        reactionName: 'szívecskés mosoly 🥰',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },
      {
        reactionIcon: '😍',
        reactionName: 'szívszem 😍',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },
      {
        reactionIcon: '❤️',
        reactionName: 'imádom ❤️',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },
      {
        reactionIcon: '💞',
        reactionName: 'keringő szívek 💞',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },
      {
        reactionIcon: '🤗',
        reactionName: 'ölelés 🤗',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },
      {
        reactionIcon: '🙏',
        reactionName: 'hála 🙏',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },
      {
        reactionIcon: '😈',
        reactionName: 'pajkos ördög 😈',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },
      {
        reactionIcon: '🔥',
        reactionName: 'tűz 🔥',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },
      {
        reactionIcon: '😯',
        reactionName: 'huha 😯',
        bgColor: 'rgba(240, 211, 117, 1)',
        color: 'rgba(235, 239, 32, 1)',
      },
      {
        reactionIcon: '😞',
        reactionName: 'szomorú 😞',
        bgColor: 'rgba(240, 211, 117, 1)',
        color: 'rgba(235, 239, 32, 1)',
      },
      {
        reactionIcon: '😢',
        reactionName: 'nagyon szomorú 😢',
        bgColor: 'rgba(234, 240, 117, 1)',
        color: 'rgb(169, 120, 21)',
      },
      {
        reactionIcon: '😭',
        reactionName: 'zokog 😭',
        bgColor: 'rgba(234, 240, 117, 1)',
        color: 'rgb(169, 120, 21)',
      },
      {
        reactionIcon: '💔',
        reactionName: 'összetört szív 💔',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },

      {
        reactionIcon: '😡',
        reactionName: 'dühítő 😡',
        bgColor: 'rgba(230, 10, 10, 1)',
        color: 'rgba(230, 10, 10, 1)',
      },
    ];
    return reactions;
  }
}
