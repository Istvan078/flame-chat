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
