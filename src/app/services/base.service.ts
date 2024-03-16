import { Injectable, OnDestroy } from '@angular/core';

import {
  AngularFireDatabase,
  AngularFireList,
} from '@angular/fire/compat/database';
import { Notes } from '../models/notes.model';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  catchError,
  finalize,
  map,
  of,
  throwError,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Recipe } from '../models/recipe.model';
import { AuthService } from './auth.service';
import { Chat } from '../models/chat.model';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { UserClass } from '../models/user.model';
import firebase from 'firebase/compat/app';

interface Friend {
  key: string;
  friendId: string;
  seenMe: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BaseService implements OnDestroy {
  user: any;
  profilePicUrlSubject: Subject<string> = new Subject();
  picturesSubject: Subject<string[]> = new Subject();
  refNotes: AngularFireList<Partial<Notes>>;
  refRecipeList!: AngularFireList<Recipe>;
  refChats!: AngularFireList<Chat>;
  refUsers: AngularFireList<UserClass>;
  refUser!: AngularFireList<UserClass>;
  refFriends!: AngularFireList<UserClass>;
  apiUrl = 'https://us-central1-project0781.cloudfunctions.net/api/';
  userProfileSubject: Subject<any> = new Subject();
  userProfilesSubject: BehaviorSubject<UserClass[]> = new BehaviorSubject<
    UserClass[]
  >([]);
  friendProfileSubject: BehaviorSubject<any> = new BehaviorSubject({});

  basePath: any = '/pictures';
  dbRef: AngularFireList<any>;

  profileSeenSubject: BehaviorSubject<any> = new BehaviorSubject([]);
  userFriendsSubject: BehaviorSubject<any> = new BehaviorSubject({});
  logicalSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  getAllMessagesSubject: BehaviorSubject<any> = new BehaviorSubject({});
  newMessageNotiSubject: BehaviorSubject<any> = new BehaviorSubject([])
  haventSeenMsgsArr: BehaviorSubject<any> = new BehaviorSubject([])

  userKeySubject: BehaviorSubject<any> = new BehaviorSubject('');
  userKeySubjectSubscription!: Subscription;
  userMessageRef: any;

  userKey: any;
  userProfile: any;

  constructor(
    private realTimeDatabase: AngularFireDatabase,
    private auth: AuthService,
    private fireStorage: AngularFireStorage,
    private http: HttpClient,
    private authService: AuthService
  ) {

    this.refChats = realTimeDatabase.list(`/chats`);
    this.refNotes = realTimeDatabase.list('/notes');
    this.refRecipeList = realTimeDatabase.list<Recipe>('/recipes');
    this.refUsers = realTimeDatabase.list('/users');
    this.dbRef = realTimeDatabase.list(this.basePath);

    this.userKeySubjectSubscription = this.userKeySubject.subscribe(
      (userKey: any) => {
        this.userKey = userKey;
        this.refFriends = this.realTimeDatabase.list(
          `/users/${userKey}/friends`
        );
      }
    );
  }

  ngOnDestroy(): void {
    this.userKeySubjectSubscription.unsubscribe();
  }

  getUserProfiles(): Observable<any> {
    return this.refUsers
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes.map((c) => ({ key: c.payload.key, ...c.payload.val() }))
        )
      );
  }

  removeUserProfile(userKey: string) {
    this.refUsers.remove(userKey)
  }

  // id: string,
  addFriends(friend: any) {
    return this.refFriends.push(friend);
  }

  updateFriend(friendKey: string, body: UserClass) {
    return firebase
      .database()
      .ref(`users/${this.userKey}/friends`)
      .once('value')
      .then((val) => {
        return this.refFriends.update(friendKey, body);
      });
  }

  getUserMessages(userUid: string) {
    const ref = this.realTimeDatabase.list('chats');

   const promise1 = new Promise((res, rej) => {
      let value;
      const mySentMessagesObj = ref.query
      .orderByChild('message/senderId/')
      .equalTo(userUid)
      .on('value', (val) =>  {
         value = val.val()
        return res(value)
      })
    })
    const promise2 =  new Promise((res,rej) => {
      let value;
      const messageFromFriendsObj = ref.query
      .orderByChild('participants/1/')
      .equalTo(userUid)
      .on('value', (val) => { 
         value = val.val()
        return res(value)
      });
    })

    const myAllMessagesArr = [promise1, promise2];
    return myAllMessagesArr
  }


  getJustSentMessage(key?: string) {
    const ref = this.realTimeDatabase.list('chats');
    if (key) {
      return ref.query.orderByChild('key').equalTo(key).once('value');
    } 
  }

  getNewMessage() {
    const ref = this.realTimeDatabase.list('chats');
    const currentTimeStamp = new Date().toLocaleString()
    const newDate = new Date()
    newDate.setHours(newDate.getHours() - 1)
    const oneHourAgo =  newDate.toLocaleString()
    return ref.query
    .orderByChild('message/timeStamp')
      .startAt(oneHourAgo)
      .endAt(currentTimeStamp)
      // .equalTo(date)
      .limitToLast(5)
      .once('value');
  }

  removeFriend(id: string) {
    // this.refFriends = this.realTimeDatabase.list('/friends')

    return this.refFriends.remove(id);
  }

  getFriends(): Observable<Friend[]> {
    if (this.userKey) {
      return this.refFriends.snapshotChanges().pipe(
        map((changes) =>
          changes.map(
            (c) =>
              <Friend>{
                key: c.payload.key,
                ...c.payload.val(),
              }
          )
        ),
        catchError((errorRes) => {
          return throwError(errorRes);
        })
      );
    }
    const tomb: Observable<Friend[]> = of([]);
    return tomb;
  }

  getFriend() {
    return this.refFriends.query.once('value');
  }

  addUserData(body: any) {
    return this.refUsers.push(body);
  }

  addUserPictures(userKey: any, body: any) {
    this.refUser = this.realTimeDatabase.list(`users/`);
    this.refUser.update(userKey, body);
  }

  // tanarral
  addFileData(user: any, fname: any, fsUrl: any) {
    const data = { name: fname, url: fsUrl };
    this.dbRef = this.realTimeDatabase.list(
      `users/${user.key}/${this.basePath}`
    );
    this.dbRef.push(data);
  }

  getData(user: any) {
    this.dbRef = this.realTimeDatabase.list(
      `users/${user['key']}${this.basePath}`
    );
    return this.dbRef;
  }

  deleteUserPicture(user: any, file: any) {
    this.refUser = this.realTimeDatabase.list(`users/${user['key']}/pictures`);
    this.refUser.remove(file.key).then(() => {
      const picturePath = `${this.basePath}/${user.displayName}/${file.name}`;
      const storegeRef = this.fireStorage.ref(picturePath);
      storegeRef.delete().subscribe(() => console.log('Kép sikeres törlése'));
    });
  }

  updateUserData(body: any, key: string) {
    this.refUsers.update(key, body);
  }

  addProfilePicture(file: any) {
    const fullPath = 'profilePictures' + '/' + file.name;
    const storageRef = this.fireStorage.ref(fullPath);
    const upload = this.fireStorage.upload(fullPath, file);
    upload
      .snapshotChanges()
      .pipe(
        finalize(() => {
          return storageRef.getDownloadURL().subscribe((url: string) => {
            this.profilePicUrlSubject.next(url);
          });
        })
      )
      .subscribe();
    return upload.percentageChanges();
  }

  addPictures(user: any, file: any) {
    const fullPath = `${this.basePath}/${user.displayName}/${file.name}`;
    const storageRef = this.fireStorage.ref(fullPath);
    const upload = this.fireStorage.upload(fullPath, file);
    upload
      .snapshotChanges()
      .pipe(
        finalize(() => {
          return storageRef.getDownloadURL().subscribe((url: any) => {
            this.addFileData(user, file.name, url);
          });
        })
      )
      .subscribe();
    return upload.percentageChanges();
  }

  addMessage(body: Chat) {
    this.refChats.push(body);
  }

  updateMessage(key: any, body: Partial<Chat>) {
    return this.refChats.update(key, body);
  }

  deleteMessage(body: any) {
    return this.refChats.remove(body['key']);
  }

  deleteMessages() {
    this.refChats.remove();
  }

  getMessages() {
    return this.refChats
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes.map((c) => ({ key: c.payload.key, ...c.payload.val() }))
        )
      );
  }

  getNotes(): Observable<Notes[]> {
    return this.refNotes.snapshotChanges().pipe(
      map((changes) =>
        changes.map((c) => <Notes>{ key: c.payload.key, ...c.payload.val() })
      ),
      catchError((errorRes) => {
        return throwError(errorRes);
      })
    );
  }

  getWeather(location: string) {
    return this.http.get(this.apiUrl + `weather?address=${location}`);
  }

  createNote(body: Partial<Notes>): void {
    this.refNotes.push(body);
  }

  deleteNote(item: Pick<Notes, 'key'>): void {
    this.refNotes.remove(item.key);
  }

  deleteAllNotes() {
    return this.http.delete(
      'https://project0781-default-rtdb.europe-west1.firebasedatabase.app/notes.json'
    );
  }

  updateNote(item: string, body: Pick<Notes, 'title' | 'body'>): void {
    this.refNotes.update(item, body);
  }

  getRecipe(key: string) {
    return this.refRecipeList
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes.map((c) => ({ key: key, Recipe: c.payload.val() }))
        )
      );
  }

  getRecipes(): Observable<any> {
    return this.refRecipeList
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes.map((c) => ({ key: c.payload.key, ...c.payload.val() }))
        )
      );
  }

  addRecipe(body: Recipe) {
    this.refRecipeList.push(body);
  }

  updateRecipe(key: string, body: Recipe) {
    this.refRecipeList.update(key, body);
  }

  deleteRecipe(key: string) {
    this.refRecipeList.remove(key);
  }
}
