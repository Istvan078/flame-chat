import { BaseService } from '../services/base.service';
export class UpdateFunctions {
  updateMessages(allChatsArr: any[], baseService: BaseService) {
    allChatsArr.map(mess => {
      const toUpdate: any = {
        message: {
          senderId_receiverId: `${mess.message.senderId}_${mess.participants[1]}`,
          message: mess.message.message,
          timeStamp: mess.message.timeStamp,
          seen: mess.message.seen,
          displayName: mess.message.displayName,
          profilePhoto: mess.message.profilePhoto,
          email: mess.message.email,
        },
      };
      baseService.updateMessage(mess.key, toUpdate);
    });
  }

  changeTimeStampFormatForAllMessages() {
    // this.base.getMessages().subscribe((mess: any) => {
    //   mess.map((msg: Chat) => {
    //     if (msg.message)
    //       (msg.message.timeStamp as any) = new Date(
    //         msg.message?.timeStamp as any
    //       ).getTime();
    //     this.base.updateMessage(msg.key, msg);
    //   });
    // });
  }
}
