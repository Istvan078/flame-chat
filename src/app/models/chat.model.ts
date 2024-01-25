export class Chat {
  [indexS: string | number]: string | number
  constructor(
   public senderId: string = '',
   public receiverId: string = '',
    public message: string = '',
    public timeStamp: string = ''
  ) {}
}
