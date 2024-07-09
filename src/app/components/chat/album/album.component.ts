import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, map, tap } from 'rxjs';
import { BaseService } from 'src/app/services/base.service';
import { FilesModalComponent } from '../../modals/files-modal/files-modal.component';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-album',
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.scss'],
})
export class AlbumComponent implements OnInit, OnDestroy {
  @HostListener('window:beforeunload', ['$event']) // Mielőtt újratölti az oldalt eseményfigyelő
  unloadHandler(event: Event) {
    localStorage.setItem('shouldNavigate', 'true');
  }

  private picturesSubscription!: Subscription;
  private picsSub!: Subscription;
  private userProfSub!: Subscription;
  uploadFinished: boolean = true;
  userProf: any = {};
  // picturesUrl: any[] = [];
  userPictures: any[] = [];
  selectedFiles: any[] = [];
  filesArr: any[] = [];
  percent: number = 0;
  constructor(
    private base: BaseService,
    private snackbar: MatSnackBar,
    private modalRef: NgbModal,
    private firestore: FirestoreService,
    private router: Router
  ) {}
  ngOnInit(): void {
    const shouldNavigate = localStorage.getItem('shouldNavigate');
    if (shouldNavigate === 'true') {
      localStorage.removeItem('shouldNavigate');
      this.router.navigate(['chat']);
    }
    // this.picturesSubscription = this.base.picturesSubject.subscribe(url => {
    //   this.picturesUrl.push(url);
    // });
    this.userProfSub = this.base.userProfileSubject.subscribe(uP => {
      this.userProf = uP;
      new Promise((res, rej) => {
        this.picsSub = this.base
          .getData(uP)
          .snapshotChanges()
          .pipe(
            map(changes =>
              changes.map(c => ({ key: c.payload.key, ...c.payload.val() }))
            )
          )
          .subscribe(pictures => {
            this.userPictures = pictures;
            if (!this.userPictures.length) rej('----NINCSENEK KÉPEK----');
            if (this.userPictures.length) {
              res('****KÉPEK LEKÉRVE****');
            }
          });
      })
        .then(res => console.log(res))
        .catch(err =>
          this.snackbar.open(
            'Nincs feltöltött kép, tölts fel képeket az albumodba!',
            'Bezár',
            {
              duration: 60000,
            }
          )
        );
    });
  }

  viewPic(i: number) {
    const actModal = this.modalRef.open(FilesModalComponent, {
      centered: true,
    });
    actModal.componentInstance.picturesArr = this.userPictures;
    actModal.componentInstance.viewIndex = i;
  }

  selectedFs($event: any) {
    this.uploadFinished = false;
    this.selectedFiles = Array.from($event.target.files);
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

  addPictures() {
    const maxWidth = 800;
    const maxHeight = 600;
    const quality = 0.75; // Tömörítési szint (0.0 - 1.0)
    this.selectedFiles.forEach(file => {
      this.resizeImage(file, maxWidth, maxHeight, quality)
        .then(resizedBlob => {
          console.log(resizedBlob);
          const resizedFile = new File([resizedBlob], file.name, {
            type: 'image/jpg',
          });
          this.base
            .addPictures(this.userProf, resizedFile)
            .subscribe(percent => {
              this.percent = percent?.toFixed(0) as any;
              this.percent = Number(this.percent);
              if (this.percent === 100 && !this.uploadFinished) {
                this.uploadFinished = true;
                this.selectedFiles = [];
                const fileModal = this.modalRef.open(FilesModalComponent, {
                  centered: true,
                });
                fileModal.componentInstance.picturesUploaded = true;
                console.log('****SIKERS FELTÖLTÉS****');
              }
            });
        })
        .catch(err => console.log(err));
    });
  }

  deleteUserPicture(pic: any) {
    this.base.deleteUserPicture(this.userProf, pic);
  }

  ngOnDestroy(): void {
    if (this.userProfSub) this.userProfSub.unsubscribe();
    if (this.picsSub) this.picsSub.unsubscribe();
    if (this.picturesSubscription) this.picturesSubscription.unsubscribe();
  }
}
