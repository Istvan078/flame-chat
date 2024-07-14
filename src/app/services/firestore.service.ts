import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentData,
} from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import {
  BehaviorSubject,
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
} from 'rxjs';
import { MyPost, Post } from '../models/post.model';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private privatePostRef!: AngularFirestoreCollection;
  private filesFromChat!: AngularFirestoreCollection;
  private sharedPostRef = this.fireStore.collection(`users/posts/shared`);
  private myPostsRef = 'users/posts/my-posts';
  private userKey = '';
  private myPostsRefImproved = `users/posts/my-posts/${this.userKey}/my-posts`;
  picturesSubject: Subject<any> = new Subject();
  filesSubject: Subject<any> = new Subject();
  filesBehSubject: BehaviorSubject<any> = new BehaviorSubject([]);
  postsNotiSubject: Subject<any> = new Subject();
  private myPostsNotiSubject: Subject<any> = new Subject();
  private getMyPostsSubject: Subject<any> = new Subject();
  userKeySubject: Subject<string> = new Subject();
  private sharedPostsSubject: BehaviorSubject<any> = new BehaviorSubject([]);
  testSubject: Subject<any> = new Subject();

  constructor(
    private fireStore: AngularFirestore,
    private fireStorage: AngularFireStorage
  ) {}

  getMyPostsSub() {
    return this.getMyPostsSubject;
  }

  async createPost(post: Post) {
    return this.sharedPostRef.add(post);
    // console.log(this.privatePostRef.ref.id);
    // console.log(this.privatePostRef.ref.path);
    // console.log(this.privatePostRef.ref.parent);
  }

  async updatePost(docId: string, post: Partial<Post>) {
    return this.sharedPostRef.doc(docId).update(post);
  }

  getMyPostsNotiSubj() {
    return this.myPostsNotiSubject;
  }

  async getPosts(isItOnMyProfile: boolean, userKey?: string) {
    if (!isItOnMyProfile)
      return this.sharedPostRef.ref
        .where('isShared', '==', 'yes')
        .get()
        .then(querySnapshot => {
          const posts: Post[] = [];
          querySnapshot.forEach((doc: any = {}) => {
            posts.push({ ...doc.data() });
          });
          return posts;
        });
    if (isItOnMyProfile) {
      const querySnapshotMyPosts = await this.sharedPostRef.ref
        .where('userKey', '==', userKey)
        .get();
      const qSnapshotSharedPostsOnMyProf = await this.sharedPostRef.ref
        .where('userKeys', 'array-contains', userKey)
        .get();
      const posts: Post[] = [];
      const postIds: string[] = [];
      querySnapshotMyPosts.forEach((doc: any = {}) => {
        posts.push({ ...doc.data() });
      });
      qSnapshotSharedPostsOnMyProf.forEach((doc: any = {}) => {
        posts.push({ ...doc.data() });
      });
      posts.map((post, i, arr) => {
        if (!postIds.includes(post.id)) {
          postIds.push(post.id);
          return post;
        } else return arr.splice(i, 1);
      });
      return posts;
    }
  }

  refreshSharedPosts() {
    return this.sharedPostRef.valueChanges('child_added');
  }

  refreshPostsAfterLike() {
    return this.sharedPostRef.valueChanges('child_added').pipe(
      map((posts: any[]) =>
        posts.filter((post: Post) => post.isShared === 'yes')
      ),
      debounceTime(500),
      distinctUntilChanged()
    );
  }

  refreshMyPosts(userKey: string) {
    const myPostsRef = this.fireStore.collection(
      `${this.myPostsRef}/${userKey}/my-posts`
    );
    return myPostsRef.valueChanges('child-added');
  }

  async createMyPost(post: MyPost, userKey: string) {
    const myPostsRef = this.fireStore.collection(
      `${this.myPostsRef}/${userKey}/my-posts`
    );
    return myPostsRef.add(post);
  }

  async getMyPosts(userKey: string) {
    const myPostsRef = this.fireStore.collection(
      `${this.myPostsRef}/${userKey}/my-posts`
    );
    return myPostsRef.ref.get().then(querySnapshot => {
      const myPosts: any[] = [];
      querySnapshot.forEach((doc: any = {}) => {
        myPosts.push({ id: doc.id, ...doc.data() });
      });
      return myPosts;
    });
  }

  async updateMyPost(userKey: string, docId: string, data: Partial<MyPost>) {
    const myPostsRef = this.fireStore.collection(
      `${this.myPostsRef}/${userKey}/my-posts`
    );
    return myPostsRef.doc(docId).update(data);
  }

  updateDocument(
    docId: string,
    updatedData: any,
    isShared: boolean,
    userKey?: string
  ) {
    const myPostsRef = this.fireStore.collection(
      `${this.myPostsRef}/${userKey}/my-posts`
    );
    if (!isShared)
      return myPostsRef
        .doc(docId)
        .update(updatedData)
        .then(() => {
          console.log('Document successfully updated!');
        })
        .catch(error => {
          console.error('Error updating document: ', error);
        });
    if (isShared)
      return this.sharedPostRef
        .doc(docId)
        .update(updatedData)
        .then(() => {
          console.log('Document successfully updated!');
        })
        .catch(error => {
          console.error('Error updating document: ', error);
        });
    return new Promise(res => {
      res('HIBA');
    });
  }

  // Dokumentum áthelyezése (másolás és törlés)
  // moveDocument(fromPath: string, toPath: string, docId: string): Promise<void> {
  //   const fromDocRef = this.fireStore.collection(fromPath).doc(docId);
  //   const toDocRef = this.fireStore.collection(toPath).doc(docId);

  //   return fromDocRef
  //     .get()
  //     .pipe(take(1))
  //     .toPromise()
  //     .then(docSnapshot => {
  //       if (docSnapshot?.exists) {
  //         const data = docSnapshot.data();
  //         return toDocRef.set(data).then(() => {
  //           return fromDocRef.delete();
  //           console.log('SIKERES DOK ÁTHELYEZÉS');
  //         });
  //       } else {
  //         return Promise.reject('Document does not exist');
  //       }
  //     });
  // }

  addFilesToChat(data: any, userKey: string) {
    this.filesFromChat = this.fireStore.collection(
      `users/private/chats/${userKey}/files`
    );
    return this.filesFromChat.add(data);
  }

  getFilesFromChat(userKey: string): Observable<DocumentData> {
    this.filesFromChat = this.fireStore.collection(
      `users/private/chats/${userKey}/files`
    );
    return this.filesFromChat.snapshotChanges(['added']);
  }

  addPublicPictures(file: any, userKey: string) {
    const picturesPath = `pictures/public-posts/${userKey}/${file.name}`;
    const storageRef = this.fireStorage.ref(picturesPath);
    const upload = this.fireStorage.upload(picturesPath, file);
    storageRef.list().subscribe(list => console.log(list));
    upload
      .snapshotChanges()
      .pipe(
        finalize(() => {
          storageRef.getDownloadURL().subscribe((url: string) => {
            console.log(url);
            const obj = {
              url,
              name: file.name,
            };
            this.picturesSubject.next(obj);
          });
        })
      )
      .subscribe();
    return upload.percentageChanges();
  }

  deleteFilesFromStorage(path: string, fileName: any) {
    const howManySlash = path.split('/');
    let mainPath: string = '';
    let filePath: string = '';
    if (howManySlash.length === 1 || !howManySlash.length)
      filePath = `${path}/${fileName}`;
    if (howManySlash.length === 2) {
      mainPath = howManySlash.join('/');
      filePath = `${mainPath}/${fileName}`;
    }
    if (howManySlash.length === 3) {
      mainPath = howManySlash.join('/');
      filePath = `${mainPath}/${fileName}`;
    }

    console.log(filePath);
    const storageRef = this.fireStorage.ref(filePath);
    console.log(storageRef);
    return storageRef.delete();
  }

  deleteFilesFromFirestore(docId: string, userKey: string) {
    const collectionPath = this.fireStore.collection(
      `users/private/chats/${userKey}/files`
    );
    return collectionPath.doc(docId).delete();
  }

  saveUserNotiSubscription(userKey: string, sub: any) {
    const notiSubPath = this.fireStore.collection(
      `users/profiles/pushSubscription/${userKey}/subscription`
    );
    return notiSubPath.add(sub);
  }

  getUserNotiSubscription(userKey: string) {
    const notiSubPath = this.fireStore.collection(
      `users/profiles/pushSubscription/${userKey}/subscription`
    );
    return notiSubPath.valueChanges();
  }

  getUserNotiSubscriptionReformed(userKey: string, endpoint: string) {
    const notiSubPath = this.fireStore.collection(
      `users/profiles/pushSubscription/${userKey}/subscription`
    );
    return notiSubPath.ref.where('endpoint', '==', endpoint).get();
  }

  deleteUserNotificationSub(userKey: string, id: string) {
    const notiSubPath = this.fireStore.collection(
      `users/profiles/pushSubscription/${userKey}/subscription`
    );
    return notiSubPath.doc(id).delete();
  }

  deleteUserNotiSubscription(userKey: string, endpoint: string) {
    const notiSubPath = this.fireStore.collection(
      `users/profiles/pushSubscription/${userKey}/subscription`
    );
    return new Promise((res, rej) => {
      notiSubPath.ref
        .where('endpoint', '==', endpoint)
        .get()
        .then(docs => {
          if (docs.empty) {
            rej('Nincs feliratkozás');
          } else {
            docs.forEach(doc => {
              console.log(doc.id, doc.data());
              const deletedDoc = notiSubPath
                .doc(doc.id)
                .delete()
                .then(() => {
                  console.log('törlés');
                  res('');
                });
            });
          }
        });
    });
  }

  addFilesFromMessages(user: any, file: any) {
    // const basePath = `fromChats/${user.displayName}/files`;
    const filesPath = `fromChats/${user.email}/files/${file.name}`;
    // const baseRef = this.fireStorage.ref(basePath);
    const storageRef = this.fireStorage.ref(filesPath);
    const upload = this.fireStorage.upload(filesPath, file);

    storageRef.getMetadata().subscribe({
      next: mD => {
        if (mD.name === file.name) {
          upload.cancel();
          console.log(mD.name, 'Már létezik ilyen fájl, feltöltés megszakítva');
          storageRef.getDownloadURL().subscribe(url => {
            const urlObj = { url, fileName: file.name };
            this.filesSubject.next(urlObj);
            console.log('url átadva');
          });
        }
      },
      error: () => {
        console.log('Fájl nem létezik az adatbázisban');
        upload
          .snapshotChanges()
          .pipe(
            finalize(() => {
              storageRef.getDownloadURL().subscribe((url: string) => {
                const urlObj = { url, fileName: file.name };
                this.filesSubject.next(urlObj);
                console.log('url átadva');
              });
            })
          )
          .subscribe(() => console.log('url átadva'));
      },
    });

    return new Promise((res, rej) => {
      res(upload);
      rej('Már van ilyen nevű fájl feltöltve az adatbázisban');
    });
  }
}
