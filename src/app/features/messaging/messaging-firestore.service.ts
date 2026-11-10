import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, DocumentData, QueryFn } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { BehaviorSubject, finalize, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessagingFirestoreService {
  private readonly injector = inject(EnvironmentInjector);

  private filesFromChat!: AngularFirestoreCollection;

  filesSubject: Subject<any> = new Subject();

  filesBehSubject: BehaviorSubject<any> = new BehaviorSubject([]);

  userKeySubject: Subject<string> = new Subject();

  testSubject: Subject<any> = new Subject();

  constructor(
    private fireStore: AngularFirestore,
    private fireStorage: AngularFireStorage,
  ) {}

  // Re-enter DI for every new reference, including calls made after await.
  private collection<T = DocumentData>(
    path: string,
    queryFn?: QueryFn,
  ): AngularFirestoreCollection<T> {
    return runInInjectionContext(this.injector, () =>
      this.fireStore.collection<T>(path, queryFn),
    );
  }

  private document<T>(
    collection: AngularFirestoreCollection<T>,
    docId: string,
  ) {
    return runInInjectionContext(this.injector, () => collection.doc(docId));
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
    this.filesFromChat = this.collection(
      `users/private/chats/${userKey}/files`,
    );
    return this.filesFromChat.add(data);
  }

  getFilesFromChat(userKey: string): Observable<DocumentData> {
    return ((this.filesFromChat as any) = this.collection(
      `users/private/chats/${userKey}/files`,
      ref => ref.orderBy('createdAt', 'desc').limit(15),
    ).snapshotChanges(['added']));
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

    const storageRef = this.fireStorage.ref(filePath);
    return storageRef.delete();
  }

  deleteFilesFromFirestore(docId: string, userKey: string) {
    const collectionPath = this.collection(
      `users/private/chats/${userKey}/files`,
    );
    return this.document(collectionPath, docId).delete();
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
            }),
          )
          .subscribe(() => console.log('url átadva'));
      },
    });

    return new Promise((res, rej) => {
      res(upload);
      rej('Már van ilyen nevű fájl feltöltve az adatbázisban');
    });
  }

  getFilesFromChats(user: any, fileName: string) {
    const filePath = `fromChats/${user.email}/files/${fileName}`;
    const storageRef = this.fireStorage.ref(filePath);
    return storageRef.getDownloadURL();
  }

  getAILimit() {
    return this.collection('ai/messaging/usage').valueChanges();
  }

  addToAiUsage(usage: any) {
    return this.collection('ai/messaging/usage').add(usage);
  }

  async updateAiUsage(usage: any) {
    const docId: string = await new Promise((res, rej) => {
      this.collection('ai/messaging/usage')
        .get()
        .forEach(doc => {
          if (doc.docs[0]?.id) res(doc.docs[0]?.id);
          if (doc.empty) this.addToAiUsage(usage);
        });
    });
    return this.document(this.collection('ai/messaging/usage'), docId).update(
      usage,
    );
  }
}
