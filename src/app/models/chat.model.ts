export class Chat {
  public key: string = '';
  public participants: [string, string];
  public message: {
    senderId: string;
    senderId_receiverId: string;
    message: string;
    voiceMessage?: string;
    timeStamp: string;
    displayName: string;
    profilePhoto: string;
    email: string;
    seen: boolean;
    reaction?: {};
  };

  [indexS: string | number]: string | number | object;
  constructor() {
    this.participants = ['user_id_1', 'user_id_2'];
    this.message = {
      senderId: '',
      senderId_receiverId: 'user_id_1-user_id_2',
      message: '',
      timeStamp: '',
      displayName: '',
      profilePhoto: '',
      email: '',
      seen: false,
    };
  }

  public set _setKey(key: string) {
    this.key = key;
  }
}
export class ReplyMessage extends Chat {
  constructor(
    public replyMessage: {
      message?: string;
      voiceMessage?: string;
    }
  ) {
    super();
  }
}
