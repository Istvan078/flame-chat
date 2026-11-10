import {
  EnvironmentInjector,
  inject,
  Injectable,
  runInInjectionContext,
} from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentData,
  QueryFn,
} from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  Subject,
} from 'rxjs';
import { MyPost, Post } from './post.model';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private readonly injector = inject(EnvironmentInjector);

  postsNotiSubject: Subject<any> = new Subject();
  private myPostsNotiSubject: Subject<any> = new Subject();
  private getMyPostsSubject: Subject<any> = new Subject();
  private sharedPostRef = this.collection(`users/posts/shared`);
  private myPostsRef = 'users/posts/my-posts';
  sharedPostIdSubject: Subject<any> = new Subject();
  picturesSubject: Subject<any> = new Subject();

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

  constructor(
    private fireStore: AngularFirestore,
    private fireStorage: AngularFireStorage,
  ) {}

  async getPosts(isItOnMyProfile: boolean, userKey?: string) {
    if (!isItOnMyProfile)
      return this.sharedPostRef.ref
        .where('isShared', '==', 'yes')
        .get()
        .then((querySnapshot: any) => {
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

  getMyPostsSub() {
    return this.getMyPostsSubject;
  }

  async createPost(post: Post) {
    return this.sharedPostRef.add(post);
  }

  async updatePost(docId: string, post: Partial<Post>) {
    return this.document(this.sharedPostRef, docId).update(post);
  }

  getMyPostsNotiSubj() {
    return this.myPostsNotiSubject;
  }

  refreshSharedWithMePosts() {
    return this.collection(`users/posts/shared`, ref =>
      ref.orderBy('newestTimeStamp', 'desc').limit(10),
    ).valueChanges(['child_changed']);
  }

  refreshPostsAfterLike() {
    return this.sharedPostRef.valueChanges('child_changed').pipe(
      map((posts: any[]) =>
        posts.filter((post: Post) => post.isShared === 'yes'),
      ),
      debounceTime(500),
      distinctUntilChanged(),
    );
  }

  refreshMyPosts(userKey: string) {
    return this.collection(`${this.myPostsRef}/${userKey}/my-posts`, ref =>
      ref.where('seen', '==', false).limit(10),
    ).valueChanges(['child_changed']);
  }

  async createMyPost(post: any, userKey: string) {
    const myPostsRef = this.collection(
      `${this.myPostsRef}/${userKey}/my-posts`,
    );
    return myPostsRef.add(post);
  }

  async getMyPosts(userKey: string) {
    const myPostsRef = this.collection(
      `${this.myPostsRef}/${userKey}/my-posts`,
    );
    return myPostsRef.ref.get().then((querySnapshot: any) => {
      const myPosts: any[] = [];
      querySnapshot.forEach((doc: any = {}) => {
        myPosts.push({ id: doc.id, ...doc.data() });
      });
      return myPosts;
    });
  }

  async updateMyPost(userKey: string, docId: string, data: Partial<MyPost>) {
    const myPostsRef = this.collection(
      `${this.myPostsRef}/${userKey}/my-posts`,
    );
    return this.document(myPostsRef, docId).update(data);
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
        }),
      )
      .subscribe();
    return upload.percentageChanges();
  }

  async deletePost(
    sharedPostId: string,
    userKey: string,
    myPostId?: string,
    fileName?: string,
  ) {
    if (fileName) {
      const storageRef = this.fireStorage.ref(
        `pictures/public-posts/${userKey}/${fileName}`,
      );
      storageRef.delete().subscribe(() => console.log(`Sikeres törlés!`));
    }
    await this.document(this.sharedPostRef, sharedPostId).delete();
    if (myPostId) {
      const myPostsRef = this.collection(
        `${this.myPostsRef}/${userKey}/my-posts`,
      );
      await this.document(myPostsRef, myPostId).delete();
    }
  }

  updateDocument(
    docId: string,
    updatedData: any,
    isShared: boolean,
    userKey?: string,
  ) {
    const myPostsRef = this.collection(
      `${this.myPostsRef}/${userKey}/my-posts`,
    );
    if (!isShared)
      return this.document(myPostsRef, docId)
        .update(updatedData)
        .then(() => {
          console.log('Document successfully updated!');
        })
        .catch(error => {
          console.error('Error updating document: ', error);
        });
    if (isShared)
      return this.document(this.sharedPostRef, docId)
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
}
