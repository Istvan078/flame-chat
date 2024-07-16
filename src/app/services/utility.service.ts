import { inject, Injectable } from '@angular/core';
import { UserClass } from '../models/user.model';
import { AuthService } from './auth.service';
import { BaseService } from './base.service';
import { map, Observable, Subject } from 'rxjs';
import { Form } from '../models/utils/form.model';

interface AllUserDetails {
  userProfiles: UserClass[];
  userProfile: UserClass;
  userProfilesUidsArr: string[];
}

@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  private auth = inject(AuthService);
  private base = inject(BaseService);
  userProfile: UserClass = new UserClass();
  userProfiles: UserClass[] = [];
  // userProfilesSub!: Subscription;
  userProfilesUidsArr: string[] = [];
  loadingSubject: Subject<any> = new Subject();
  postsFormData: Form[] = [
    {
      label: 'Név',
      matIcon: 'person',
      input: {
        formControlName: 'name',
      },
    },
    {
      textArea: true,
      label: 'Bejegyzés szövege',
      input: { formControlName: 'message' },
    },
    {
      label: 'Youtube link',
      input: { formControlName: 'iFrame' },
    },
  ];
  constructor() {}

  async getUserProfiles(): Promise<Observable<AllUserDetails>> {
    const user = await this.auth.getUser();
    return this.base.getUserProfiles().pipe(
      map((uProfs: UserClass[]) => {
        this.userProfiles = uProfs;
        this.userProfilesUidsArr = this.userProfiles.map(uP => uP.uid);
        const userProfile = uProfs.filter(uP => uP.uid === user.uid);
        Object.assign(this.userProfile, ...userProfile);
        console.log(this.userProfile);
        return {
          userProfiles: this.userProfiles,
          userProfilesUidsArr: this.userProfilesUidsArr,
          userProfile: this.userProfile,
        };
      })
    );
  }

  getFormDataForPosts() {
    return this.postsFormData;
  }

  resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number
  ): Promise<Blob> {
    return new Promise((res, rej) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = e => {
        img.src = e.target?.result as string;
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        console.log(canvas, ctx);
        canvas.toBlob(
          blob => {
            if (blob) {
              res(blob);
            } else rej(new Error('A vászon üres'));
          },
          'image/jpg',
          quality
        );
      };
      reader.onerror = error => {
        rej(error);
      };
      reader.readAsDataURL(file);
    });
  }
}
