import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, DocumentData, Reference } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, Subject, finalize } from 'rxjs';
import { Post } from '../models/post.model';


@Injectable({
  providedIn: 'root',
})
export class FirestoreService {

  private privatePostRef!: AngularFirestoreCollection
  private sharedPostRef = this.fireStore.collection(`users/posts/shared`);
  picturesSubject: Subject<any> = new Subject()

  constructor(
    private fireStore: AngularFirestore,
    private fireStorage: AngularFireStorage
  ) {
   
  }

  createPost(post: Post, notShared?: boolean, userKey?: string) {
    if(!notShared){
    this.sharedPostRef.add(post)
  }
    else{
      this.privatePostRef = this.fireStore.collection(`users/posts/private/${userKey}/posts`);
      this.privatePostRef.add(post)
      console.log(this.privatePostRef.ref.id)
      console.log(this.privatePostRef.ref.path)
      console.log(this.privatePostRef.ref.parent)
    }
  }

  getSharedPosts() {
    return this.sharedPostRef.valueChanges();
  }

  getPrivatePosts(userKey: string):Observable<DocumentData> {
    this.privatePostRef = this.fireStore.collection(`users/posts/private/${userKey}/posts`);
    return this.privatePostRef.valueChanges();
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
              url, name: file.name
            }
            this.picturesSubject.next(obj)
          });
        })
      )
      .subscribe();
    return upload.percentageChanges();
  }
}
