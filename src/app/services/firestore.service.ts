import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentData,
} from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { BehaviorSubject, Observable, Subject, finalize } from 'rxjs';
import { Post } from '../models/post.model';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private privatePostRef!: AngularFirestoreCollection;
  private filesFromChat!: AngularFirestoreCollection;
  private sharedPostRef = this.fireStore.collection(`users/posts/shared`);
  private myPostsRef = this.fireStore.collection('users/posts/my-posts');
  picturesSubject: Subject<any> = new Subject();
  filesSubject: Subject<any> = new Subject();
  filesBehSubject: BehaviorSubject<any> = new BehaviorSubject([]);
  postsNotiSubject: Subject<any> = new Subject();

  constructor(
    private fireStore: AngularFirestore,
    private fireStorage: AngularFireStorage
  ) {}

  createPost(
    post: Post,
    notShared?: boolean,
    userKey?: string,
    postedOnMyProf?: boolean
  ) {
    if (!notShared && !postedOnMyProf) {
      this.sharedPostRef.add(post);
    } else if (notShared && !postedOnMyProf) {
      this.privatePostRef = this.fireStore.collection(
        `users/posts/private/${userKey}/posts`
      );
      this.privatePostRef.add(post);
      // console.log(this.privatePostRef.ref.id);
      // console.log(this.privatePostRef.ref.path);
      // console.log(this.privatePostRef.ref.parent);
    } else if (!notShared && postedOnMyProf) {
      this.myPostsRef.add(post);
      this.sharedPostRef.add(post);
    } else {
      this.myPostsRef.add(post);
    }
  }

  async getMyPosts() {
    return this.myPostsRef.ref.get().then(querySnapshot => {
      const myPosts: any[] = [];
      querySnapshot.forEach((doc: any = {}) => {
        myPosts.push({ id: doc.id, ...doc.data() });
      });
      return myPosts;
    });
  }

  getSharedPosts() {
    return this.sharedPostRef.ref
      .where('notSeen', '!=', [])
      .get()
      .then(querySnapshot => {
        const posts: any[] = [];
        querySnapshot.forEach((doc: any = {}) => {
          posts.push({ id: doc.id, ...doc.data() });
        });
        console.log(posts);
        return posts;
      });
  }

  refreshSharedPosts() {
    return this.sharedPostRef.valueChanges('child_added');
  }

  updateDocument(docId: string, updatedData: any, isShared: boolean) {
    if (!isShared)
      return this.myPostsRef
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

  getPrivatePosts(userKey: string): Observable<DocumentData> {
    this.privatePostRef = this.fireStore.collection(
      `users/posts/private/${userKey}/posts`
    );
    return this.privatePostRef.valueChanges();
  }

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
