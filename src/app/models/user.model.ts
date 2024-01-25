import { Chat } from "./chat.model";


export class UserClass {
  [indexS: string | number] : string | undefined | object | number 
  public friends: { [indexS: string | number] : string | undefined | object | number 
    key?:string;
    friendId: string;
    messages: Chat[]
  }[];

  constructor(
    public key?: string,
    public birthDate: string = '',
    public gender: string = '',
    public uid: string = '',
    public email?: string,
    public displayName: string = '',
    //   public message?:string,
    //   public  date?: string,
    private claims?: {
      superAdmin: boolean;
      admin: boolean;
      basic: boolean;
    },
    public profilePicture: string = ''
  ) {
    this.friends = [
      {
        friendId: '',
        messages: [{senderId: "",
      receiverId:'',
    message:'',
  timeStamp:''}]
      },
    ];
  }
}
