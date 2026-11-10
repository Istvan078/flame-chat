import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import { AngularFireDatabase, AngularFireList, AngularFireObject, PathReference, QueryFn } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { BehaviorSubject, Observable, Subject, catchError, finalize, map, of, throwError } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import firebase from 'firebase/compat/app';
import { FilesModalComponent } from 'src/app/shared/ui/files-modal/files-modal.component';
import { Friends, UserClass } from './user.model';

@Injectable({
  providedIn: 'root',
})
export class PeopleService {
  private readonly injector = inject(EnvironmentInjector);

  profilePicUrlSubject: Subject<string> = new Subject();

  picturesSubject: Subject<string[]> = new Subject();

  refUsers: AngularFireList<UserClass>;

  refUser!: AngularFireList<UserClass>;

  apiUrl = 'https://us-central1-project0781.cloudfunctions.net/api/';

  userProfileSubject: BehaviorSubject<any> = new BehaviorSubject({});

  userProfilesSubject: BehaviorSubject<UserClass[]> = new BehaviorSubject<
    UserClass[]
  >([]);

  friendProfileSubject: BehaviorSubject<any> = new BehaviorSubject({});

  basePath: any = '/pictures';

  dbRef: AngularFireList<any>;

  constructor(
    private realTimeDatabase: AngularFireDatabase,
    private fireStorage: AngularFireStorage,
    private modalRef: NgbModal,
  ) {
    this.refUsers = this.databaseList('/users');
    this.dbRef = this.databaseList(this.basePath);
  }

  // AngularFire 21 reference factories use inject(), including from callbacks.
  private databaseList<T = any>(
    path: PathReference,
    queryFn?: QueryFn,
  ): AngularFireList<T> {
    return runInInjectionContext(this.injector, () =>
      this.realTimeDatabase.list<T>(path, queryFn),
    );
  }

  private databaseObject<T = any>(path: PathReference): AngularFireObject<T> {
    return runInInjectionContext(this.injector, () =>
      this.realTimeDatabase.object<T>(path),
    );
  }

  profileSeenSubject: BehaviorSubject<any> = new BehaviorSubject([]);

  getUserProfiles(): Observable<any> {
    return this.refUsers.snapshotChanges().pipe(
      map(changes =>
        changes.map(c => ({ key: c.payload.key, ...c.payload.val() })),
      ),
      catchError((err, caught) => {
        throw err;
      }),
    );
  }

  removeUserProfile(userKey: string) {
    this.refUsers.remove(userKey);
  }

  addFriends(friend: any, friendKey: string, userKey: string) {
    return this.databaseObject(`users/${userKey}/friends/${friendKey}`).update(
      friend,
    );
  }

  updateFriend(friendKey: string, body: UserClass, userKey: string) {
    const refFriends = this.databaseList(`users/${userKey}/friends`);
    return firebase
      .database()
      .ref(`users/${userKey}/friends`)
      .once('value')
      .then(val => {
        return refFriends.update(friendKey, body);
      });
  }

  updateFriendsFriend(friendKey: string, userProfKey: string, data: any) {
    const ref = this.databaseList(`users/${friendKey}/friends`);
    return ref.update(userProfKey, data);
  }

  removeFriend(friendKey: string, userKey: string) {
    const refFriends = this.databaseList(`users/${userKey}/friends`);
    return refFriends.remove(friendKey);
  }

  removeFriendsFriend(friendKey: string, userProfKey: string) {
    const ref = this.databaseList(`users/${friendKey}/friends`);
    return ref.remove(userProfKey);
  }

  getFriends(userProfKey: string): Observable<Friends[]> {
    const refFriends = this.databaseList(`users/${userProfKey}/friends`);
    if (userProfKey) {
      return <Observable<Friends[]>>(
        refFriends
          .snapshotChanges(['child_changed', 'child_removed', 'child_added'])
          .pipe(
            map(changes =>
              changes.map(
                (c: any) =>
                  <Friends>{
                    key: c.payload.key,
                    ...c.payload.val(),
                  },
              ),
            ),
            catchError(errorRes => {
              return throwError(errorRes);
            }),
          )
      );
    }
    const emptyArrObs: Observable<Friends[]> = of([]);
    return emptyArrObs;
  }

  addUserData(body: any) {
    return this.refUsers.push(body);
  }

  addUserPictures(userKey: any, body: any) {
    this.refUser = this.databaseList(`users/`);
    this.refUser.update(userKey, body);
  }

  // tanarral
  addFileData(user: any, fname: any, fsUrl: any) {
    const data = { name: fname, url: fsUrl };
    this.dbRef = this.databaseList(`users/${user.key}/${this.basePath}`);
    this.dbRef.push(data);
  }

  getData(user: any) {
    this.dbRef = this.databaseList(`users/${user['key']}${this.basePath}`);
    return this.dbRef;
  }

  deleteUserPicture(user: any, file: any) {
    this.refUser = this.databaseList(`users/${user['key']}/pictures`);
    this.refUser.remove(file.key).then(() => {
      const picturePath = `${this.basePath}/${user.displayName}/${file.name}`;
      const storegeRef = this.fireStorage.ref(picturePath);
      storegeRef.delete().subscribe(() => console.log('Kép sikeres törlése'));
    });
  }

  updateUserData(body: any, key: string) {
    if (key) return this.refUsers.update(key, body);
  }

  deleteUserData(id: string) {
    return this.refUsers.remove(id);
  }

  getProfilePictures(userEmail: string) {
    const fullPath = 'profilePictures/' + userEmail;
    const storageRef = this.fireStorage.ref(fullPath);
    const urls: any[] = [];
    return new Promise(res => {
      storageRef.listAll().subscribe(what => {
        what.items.forEach(item =>
          item
            .getDownloadURL()
            .then(url => urls.push(url))
            .then(resolve => {
              res(urls);
            }),
        );
      });
    });
  }

  async showProfPics(userEmail: string) {
    const profPicsArr = await this.getProfilePictures(userEmail);
    const modal = this.modalRef.open(FilesModalComponent, {
      centered: true,
      animation: true,
    });
    modal.componentInstance.profPicsArr = profPicsArr;
  }

  addProfilePicture(file: any, userEmail: string) {
    const fullPath = 'profilePictures/' + userEmail + '/' + file.name;
    const storageRef = this.fireStorage.ref(fullPath);
    const upload = this.fireStorage.upload(fullPath, file);
    upload
      .snapshotChanges()
      .pipe(
        finalize(() => {
          return storageRef.getDownloadURL().subscribe((url: string) => {
            this.profilePicUrlSubject.next(url);
          });
        }),
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
        }),
      )
      .subscribe();
    return upload.percentageChanges();
  }

  isUserOnline(userKey: string, online: boolean) {
    return this.realTimeDatabase.database
      .ref(`users/${userKey}`)
      .onDisconnect()
      .update({ online: online, lastTimeOnline: new Date().getTime() });
  }
}
