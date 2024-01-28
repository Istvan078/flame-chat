import { Injectable, OnInit } from '@angular/core';

import {
  AngularFireDatabase,
  AngularFireList,
} from '@angular/fire/compat/database';
import { Notes } from '../models/notes';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  finalize,
  map,
  throwError,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Recipe } from '../models/recipe.model';
import { AuthService } from './auth.service';
import { Chat } from '../models/chat.model';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { UserClass } from '../models/user.model';
import { ChatComponent } from '../components/chat/chat.component';

interface Note {
  body: string;
  counter: number;
  timeStamp: string;
  title: string;
  id?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BaseService implements OnInit {
  user: any;
  profilePicUrlSubject: Subject<string> = new Subject();
  picturesSubject: Subject<string[]> = new Subject();
  refNotes: AngularFireList<Notes>;
  refRecipeList!: AngularFireList<Recipe>;
  refChats!: AngularFireList<Chat>;
  refUsers: AngularFireList<UserClass>;
  refUser!: AngularFireList<UserClass>;
  refFriends!: AngularFireList<any>
  apiUrl = 'https://us-central1-project0781.cloudfunctions.net/api/';
  userProfileSubject: Subject<any> = new Subject();

  basePath: any = '/pictures';
  dbRef: AngularFireList<any>;

  keysSubject: Subject<object> = new Subject();
  keysObject: { userKey: string; friendKey: string } = {
    userKey: '',
    friendKey: '',
  };
  userMessageRef: any;

  constructor(
    private realTimeDatabase: AngularFireDatabase,

    private fireStorage: AngularFireStorage,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.keysSubject.subscribe((keysObject: any) => {
      console.log(keysObject);
      this.keysObject = {
        userKey: keysObject.userKey,
        friendKey: keysObject.friendKey,
      };
    });

    this.refChats = realTimeDatabase.list(`/chats`);
    this.refNotes = realTimeDatabase.list('/notes');
    this.refRecipeList = realTimeDatabase.list<Recipe>('/recipes');
    this.refUsers = realTimeDatabase.list('/users');
    this.dbRef = realTimeDatabase.list(this.basePath);
  }

  ngOnInit(): void {}

  getUserProfiles(): Observable<any> {
    return this.refUsers
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes.map((c) => ({ key: c.payload.key, ...c.payload.val() }))
        )
      );
  }

  addFriends(id: string, data: UserClass) {
   return this.refFriends.update(id, data);
  }

  removeFriend(id: string) {
   return this.refFriends.remove(id)
  }

  getFriends(userKey: string) {
    this.refFriends = this.realTimeDatabase.list(
      `/users/${userKey}/friends`
    );

    return this.refFriends
    .snapshotChanges()
    .pipe(
      map((changes) =>
        changes.map((c) => ({
          key: c.payload.key,
          ...c.payload.val(),
        }))
      )
    )
  }

  addUserData(body: any) {
    this.refUsers.push(body);
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
    
    this.refUser = this.realTimeDatabase
    .list(`users/${user['key']}/pictures`)
    this.refUser.remove(file.key).then(
      ()=> {
        const picturePath = `${this.basePath}/${user.displayName}/${file.name}`;
        const storegeRef = this.fireStorage.ref(picturePath);
        storegeRef.delete().subscribe(
          () => console.log("Kép sikeres törlése")
        );
      }
    )

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
    // const storageBaseRef = this.fireStorage.ref(`${this.basePath}/${user.displayName}`)
    // storageBaseRef.child(file.name).getDownloadURL().subscribe()
    const fullPath = `${this.basePath}/${user.displayName}/${file.name}`;
    const storageRef = this.fireStorage.ref(fullPath);
    const upload = this.fireStorage.upload(fullPath, file);
    upload
      .snapshotChanges()
      .pipe(
        finalize(() => {
          return storageRef.getDownloadURL().subscribe((url: any) => {
            // if(!user.pictures) user.pictures = []
            // let imgObj = {
            //   imageUrl: url,
            //   fileName: file.name
            // }
            // user.pictures.push(imgObj)
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
    this.refChats.update(key, body);
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

  getNotes() {
    return this.refNotes.snapshotChanges().pipe(
      map((changes) =>
        changes.map((c) => ({ key: c.payload.key, ...c.payload.val() }))
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
