import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentData,
  Reference,
} from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  finalize,
  of,
} from 'rxjs';
import { Post } from '../models/post.model';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private privatePostRef!: AngularFirestoreCollection;
  private filesFromChat!: AngularFirestoreCollection;
  private sharedPostRef = this.fireStore.collection(`users/posts/shared`);
  picturesSubject: Subject<any> = new Subject();
  filesSubject: Subject<any> = new Subject();
  filesBehSubject: BehaviorSubject<any> = new BehaviorSubject([]);

  constructor(
    private fireStore: AngularFirestore,
    private fireStorage: AngularFireStorage
  ) {}

  createPost(post: Post, notShared?: boolean, userKey?: string) {
    if (!notShared) {
      this.sharedPostRef.add(post);
    } else {
      this.privatePostRef = this.fireStore.collection(
        `users/posts/private/${userKey}/posts`
      );
      this.privatePostRef.add(post);
      console.log(this.privatePostRef.ref.id);
      console.log(this.privatePostRef.ref.path);
      console.log(this.privatePostRef.ref.parent);
    }
  }

  getSharedPosts() {
    return this.sharedPostRef.valueChanges();
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
    return this.filesFromChat.valueChanges();
  }

  addPublicPictures(file: any) {
    const picturesPath = `pictures/${file.name}`;
    const storageRef = this.fireStorage.ref(picturesPath);
    const upload = this.fireStorage.upload(picturesPath, file);
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

  addFilesFromMessages(user: any, file: any) {
    // const basePath = `fromChats/${user.displayName}/files`;
    const filesPath = `fromChats/${user.email}/files/${file.name}`;
    // const baseRef = this.fireStorage.ref(basePath);
    const storageRef = this.fireStorage.ref(filesPath);
    const upload = this.fireStorage.upload(filesPath, file);

    storageRef.getMetadata().subscribe({
      next: (mD) => {
        if (mD.name === file.name) {
          upload.cancel();
          console.log(mD.name, 'Már létezik ilyen fájl, feltöltés megszakítva');
          storageRef.getDownloadURL().subscribe(
            (url) => {
              const urlObj = { url, fileName: file.name };
              this.filesSubject.next(urlObj);
              console.log('url átadva');
            }
          )
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

    return new Promise((res,rej) => {
      res(upload)
      rej('Már van ilyen nevű fájl feltöltve az adatbázisban')
    }) ;
  }
}
