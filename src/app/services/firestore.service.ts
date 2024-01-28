import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  fireStrorageRef: any = '/users';

  constructor(
    private fireStore: AngularFirestore,
    private fireStorage: AngularFireStorage
  ) {}

  addPicturesUrls(userKey: string, url: string, name: string) {
    const picRef = this.fireStore.collection(`/users/${userKey}/pictures/`)
    const picture = {
      url, name
    }
    picRef.add(picture)
  }

  getPictures(userKey: string) {
    const picRef = this.fireStore.collection(`/users/${userKey}/pictures/`)
    return picRef.valueChanges()
  }

  addPictures(file: any, userKey: any) {
    const picturesPath = `${this.fireStrorageRef}/${userKey}/pictures/${file.name}`;
    const storageRef = this.fireStorage.ref(picturesPath);
    const upload = this.fireStorage.upload(picturesPath, file);
    upload
      .snapshotChanges()
      .pipe(
        finalize(() => {
          storageRef
            .getDownloadURL()
            .subscribe((url: string) => {console.log(url)
              this.addPicturesUrls(userKey, url, file.name)
            });
        })
      )
      .subscribe();
      return upload.percentageChanges()
  }
}
