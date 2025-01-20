// import { BaseService } from '../services/base.service';
// export class UpdateFunctions {
//   updateMessages(allChatsArr: any[], baseService: BaseService) {
//     allChatsArr.map(mess => {
//       const toUpdate: any = {
//         message: {
//           senderId_receiverId: `${mess.message.senderId}_${mess.participants[1]}`,
//           message: mess.message.message,
//           timeStamp: mess.message.timeStamp,
//           seen: mess.message.seen,
//           displayName: mess.message.displayName,
//           profilePhoto: mess.message.profilePhoto,
//           email: mess.message.email,
//         },
//       };
//       baseService.updateMessage(mess.key, toUpdate);
//     });
//   }

//   changeTimeStampFormatForAllMessages() {
//     // this.base.getMessages().subscribe((mess: any) => {
//     //   mess.map((msg: Chat) => {
//     //     if (msg.message)
//     //       (msg.message.timeStamp as any) = new Date(
//     //         msg.message?.timeStamp as any
//     //       ).getTime();
//     //     this.base.updateMessage(msg.key, msg);
//     //   });
//     // });
//   }
// }

// updateMessages(key: any, body: Partial<Chat>) {
//   return this.refChats.update(key, body);
// }

// ÜZENET UPDATE, TÖRLÉS, SZÁMOZÁS ÜZENETEK KEYÉBE ///////////////////////////
// let safetyArr: any[] = [];
// let deleteArr: any[] = [];
// for (let i = 0; i < this.visibleMessages.length; i++) {
//   const actMsg: Chat = this.visibleMessages[i];
//   const strIndex = i + 1;
//   strIndex.toString();
//   const deleteKey = actMsg.key;
//   console.log(deleteKey);
//   actMsg.key =
//     actMsg.message.senderId === this.userProfile.uid
//       ? this.userProfile.uid + '_' + strIndex
//       : this.selectedFriend.uid + '_' + strIndex;
//   if (actMsg.message.senderId === this.userProfile.uid) {
//     await this.base.updateMessage(
//       actMsg.key,
//       actMsg,
//       this.userProfile.key,
//       this.selectedFriend.key
//     );
//     await this.base.deleteMessage(
//       this.userProfile.key,
//       this.selectedFriend.key,
//       deleteKey
//     );
//   }
//   if (actMsg.message.senderId !== this.userProfile.uid) {
//     await this.base.updateMessage(
//       actMsg.key,
//       actMsg,
//       this.selectedFriend.key,
//       this.userProfile.key
//     );
//     await this.base.deleteMessage(
//       this.selectedFriend.key,
//       this.userProfile.key,
//       deleteKey
//     );
//   }

//   safetyArr.push(actMsg.key);

//   // const isDuplicated = actMsg.key.split('_');
//   // const number = +isDuplicated[1];
//   // const time = new Date(actMsg.message.timeStamp).getTime();
//   // if (!safetyArr.includes(time)) safetyArr.push(time);
//   // else console.log(actMsg);

//   // const isDuplicated = actMsg.key.split('_');
//   // const isNumber = +isDuplicated[1];
//   // if (!isNumber)
//   //   this.base.deleteMessage(
//   //     this.userProfile.key,
//   //     this.selectedFriend.key,
//   //     actMsg.key
//   //   );
//   // const isNumber = +actMsg.key.split('_')[1];
//   // if (!isNumber)
//   //   await this.base.deleteMessage(
//   //     this.userProfile.key,
//   //     this.selectedFriend.key,
//   //     actMsg.key
//   //   );
// }

/////////// ÜZENET TÖRLÉSE ///////////////////////
// deleteMessage(message: Chat) {
//   this.base.deleteMessage(message).then(() => {
//     this.urlText = [];
//     this.allChatsArray = this.allChatsArray.filter(
//       mess => mess.key !== message.key
//     );
//     this.getVisibleMessagesForSelectedFriend();
//   });
// }

////// HANGFELVÉTEL LETÖLTÉSE ////////////////
// const url = URL.createObjectURL(recordedAudioFile);
// const a = document.createElement('a');
// a.href = url;
// a.download = 'felvetel.m4a';
// document.body.appendChild(a);
// a.click();
// document.body.removeChild(a);
// URL.revokeObjectURL(url);
