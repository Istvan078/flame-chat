type Claims = {
  basic: boolean;
  admin: boolean;
  superAdmin: boolean;
};

export interface Friends {
  displayName?: string;
  email?: string;
  friendId: string;
  seenMe?: boolean;
  friendKey?: string;
  profilePicture?: string;
  online?: boolean;
  lastTimeOnline?: any;
}

export class UserClass {
  [indexS: string | number]: string | undefined | object | number | boolean;
  public friends?: {
    key: string;
    friendId: string;
    seenMe: boolean;
    messaging?: boolean;
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
  constructor(
    public birthDate: string = '',
    public gender: string = '',
    public displayName: string = '',
    public pictures: { name: string; url: string }[] = [],
    public profilePicture: string = ''
  ) {
    this.claims = {
      basic: true,
      admin: false,
      superAdmin: false,
    };
    this.age = 0;
  }

  // get token() {
  //   if (!this._tokenExpirationDate || new Date() > this._tokenExpirationDate) {
  //     return undefined
  //   }
  //   return this._token
  // }

  ageCalc() {
    const date = new Date().toLocaleDateString().split('/').reverse();
    let birthDate;
    if (this.birthDate.includes('-')) {
      birthDate = this.birthDate.trim().split('-');
    }
    // else if(this.birthDate.includes(".")){
    //   birthDate = this.birthDate.trim().split('.');
    // } else if(this.birthDate.includes("/")){
    //   birthDate = this.birthDate.trim().split('/');
    // }

    const actDateObj = {
      year: Number(date[0].substring(0, 4)),
      month: Number(date[2].substring(0, 2)),
      day: Number(date[1].substring(0, 2)),
    };
    const birthDateObj = {
      year: Number(birthDate![0]),
      month: Number(birthDate![1]),
      day: Number(birthDate![2]),
    };

    this.age =
      actDateObj.year -
      birthDateObj.year -
      (birthDateObj.month * 30 - actDateObj.month * 30) / 360;
    this.age = Math.floor(this.age);
  }
}
