import firebase from 'firebase/compat';
import { Subscription } from 'rxjs';
type Claims = {
  basic: boolean;
  admin: boolean;
  superAdmin: boolean;
};

type Position = {
  position: string;
  time: number;
};

export type FirebaseUser = firebase.User | null;

export interface Friends {
  displayName?: string;
  email?: string;
  friendId: string;
  seenMe?: boolean;
  friendKey?: string;
  profilePicture?: string;
  online?: boolean;
  lastTimeOnline?: any;
  lastTimeOnlineUnix?: number;
  confirmed: boolean;
  areFriends?: boolean;
  visibility: boolean;
  newMessageNumber?: number;
  messaging?: boolean;
}

export class ForUserSubject {
  userProfiles: UserClass[] = [];
  userProfile: UserClass = new UserClass();
  userFriends: any[] = [];
  userNotFriends: any[] = [];
  notConfirmedMeUsers: any[] = [];
  subscription: Subscription = Subscription.EMPTY;
}

export class UserClass {
  [indexS: string | number]: string | undefined | object | number | boolean;
  public friends?: {
    key: string;
    friendId: string;
    seenMe: boolean;
    messaging?: boolean;
    displayName?: string;
    profilePicture?: string;
    confirmed?: boolean;
    newMessageNumber?: number;
  }[];
  public age: number;
  public phoneNumber: string = '';
  public email?: string;
  public claims: Claims;
  public idToken?: string;
  public online?: boolean;
  public lastTimeOnline?: number;
  public key: string = '';
  public uid: string = '';
  public pushNotificationsOn?: boolean;
  constructor(
    public surname: string = '',
    public firstname: string = '',
    public displayName?: string,
    public birthDate: string = '',
    public gender: string = '',
    public pictures: { name: string; url: string }[] = [],
    public profilePicture: string = '',
    public visibility: boolean = true,
    public appVersion: number = 1,
    public positions: Position[] = [],
    public curPosition: string = ''
  ) {
    this.claims = {
      basic: true,
      admin: false,
      superAdmin: false,
    };
    this.age = 0;
  }

  ageCalc() {
    const date = new Date().toLocaleDateString();
    let dateArr: string[] = [];
    if (date.includes('/')) {
      dateArr = date.split('/').reverse();
      const month = dateArr.pop();
      const day = dateArr.pop();
      dateArr.push(month!);
      dateArr.push(day!);
    }
    if (date.includes('-')) dateArr = date.split('-');
    if (date.includes('.')) dateArr = date.split('.');
    let birthDate: any[] = [];
    if (this.birthDate.includes('-'))
      birthDate = this.birthDate.trim().split('-');
    if (this.birthDate.includes('/')) {
      birthDate = this.birthDate.trim().split('/').reverse();
      const month = birthDate.pop();
      const day = birthDate.pop();
      birthDate.push(month!);
      birthDate.push(day!);
    }

    if (this.birthDate.includes('.'))
      birthDate = this.birthDate.trim().split('.');
    console.log(dateArr);
    console.log(birthDate);
    const actDateObj = {
      year: Number(dateArr[0].trim().substring(0, 4)),
      month: Number(dateArr[1].trim().substring(0, 2)),
      day: Number(dateArr[2].trim().substring(0, 2)),
    };
    let birthDateObj: any = {};
    if (birthDate?.length) {
      birthDateObj = {
        year: Number(birthDate[0]),
        month: Number(birthDate[1]),
        day: Number(birthDate[2]),
      };
    }

    this.age =
      actDateObj.year -
      birthDateObj.year -
      (birthDateObj.month * 30 - actDateObj.month * 30) / 360;
    this.age = Math.floor(this.age);
    console.log(this.age);
  }
}
