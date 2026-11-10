// ÜZENETEK senderId_receiverId FRISSÍTÉSE //

// this.allChatsArray.map(ch => {
//   ch.message.senderId_receiverId =
//     ch.message.senderId_receiverId + '_' + ch.message.timeStamp;
//   this.base.updateMessage(ch.key, ch).then(cha => console.log(ch));
// });

// getFriendsForReset(userKey: string): Observable<any[]> {
//   return this.realTimeDatabase
//     .list(`users/${userKey}/friends`)
//     .snapshotChanges()
//     .pipe(
//       map(changes =>
//         changes.map((c: any) => ({ key: c.payload.key, ...c.payload.val() }))
//       )
//     );
// }

// removeFriendsForReset(userKey: string, friendKey: string) {
//   return this.realTimeDatabase
//     .object(`users/${userKey}/friends/${friendKey}`)
//     .remove();
// }

// resetFriends(userKey: string, friendKey: string, friend: any) {
//   return this.realTimeDatabase
//     .object(`users/${userKey}/friends/${friendKey}`)
//     .update(friend);
// }

// const data = await this.base.getMessagesByDate(
//   this.userProfile.uid,
//   this.selectedFriendId!,
//   this.userProfile.key,
//   this.selectedFriend.key,
//   'Fri Jan 25 2025'
// );
// this.visibleMessages = data;
// this.visibleMessages.map(mess => {
//   mess.message.viewTimeStamp = new Date(
//     mess.message.timeStamp
//   ).toLocaleString();
// });
// console.log(data);

// getMessagesByDate(
//     userUid: string,
//     friendUid: string,
//     userKey: string,
//     friendKey: string,
//     date: string
//   ): Promise<any[]> {
//     if (friendUid) {
//       const askedDate = new Date(date);
//       console.log(askedDate);
//       const toDate = new Date('Fri Jan 26 2025');
//       // toDate.setMonth(toDate.getMonth() - 3);
//       console.log(toDate);
//       const promise1 = new Promise(res => {
//         const ref2 = this.realTimeDatabase.list(
//           `chats/${userKey}/${friendKey}`,
//           ref2 => {
//             return ref2
//               .orderByChild('participants/2')
//               .startAt(
//                 ((userUid + friendUid) as string) + '-' + askedDate.getTime()
//               )
//               .endAt(((userUid + friendUid) as string) + '-' + toDate.getTime())
//               .limitToLast(100);
//           }
//         );
//         ref2.valueChanges(['child_added']).subscribe(val => {
//           return res(val);
//         });
//       });

//       const promise2 = new Promise(res => {
//         const ref3 = this.realTimeDatabase.list(
//           `chats/${friendKey}/${userKey}`,
//           ref3 =>
//             ref3
//               .orderByChild('message/senderId_receiverId')
//               .startAt(`${friendUid}_${userUid}_${askedDate.getTime()}`)
//               .endAt(`${friendUid}_${userUid}_${toDate.getTime()}`)
//               .limitToLast(100)
//           // .equalTo(`${userUid}_${friendUid}`)
//         );
//         ref3.valueChanges(['child_added']).subscribe(val => {
//           res(val);
//         });
//       });
//       const myAllMessagesArr = [promise1, promise2];
//       const frAndMyMessages: Promise<any[]> = Promise.all(
//         myAllMessagesArr
//       ).then(res => {
//         return res.flat();
//       });
//       return frAndMyMessages;
//     } else return new Promise(res => res([]));
//   }
