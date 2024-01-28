


export class UserClass {
  [indexS: string | number] : string | undefined | object | number 
  public friends: { [indexS: string | number] : string | undefined | object | number 
    key?:string;
    friendId: string;
  }[];

  constructor(
    public key?: string,
    public birthDate: string = '',
    public gender: string = '',
    public uid: string = '',
    public email?: string,
    public displayName: string = '',
    public pictures: {name:string, url: string}[] = [],
    public profilePicture: string = ''
  ) {
    this.friends = [
      {
        friendId: '',

      },
    ];
  }
}
