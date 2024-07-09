import { Component } from '@angular/core';
import { Post } from 'src/app/models/post.model';
import { ModalComponent } from '../../modals/modal/modal.component';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserClass } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { AuthService } from 'src/app/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-posts',
  templateUrl: './my-posts.component.html',
  styleUrls: ['./my-posts.component.scss'],
})
export class MyPostsComponent {
  submitButtonValue: any;
  sharedPictures: any[] = [];
  post!: Post;
  publishForm!: FormGroup;
  chosenFiles: any;
  comment: any = {};
  userProfile: UserClass = new UserClass();
  userProfilesUidsArr: Partial<UserClass[]> | any[] = [];
  userProfiles: UserClass[] = [];
  uploadedPictures: any[] = [];
  picturesArray: any[] = [];
  sharedPosts: Post[] = [];
  myPostsArr: Post[] = [];
  privatePosts: Post[] = [];
  peopleLikedPost: any[] = [];
  picturesSubscription!: Subscription;
  userProfilesSub!: Subscription;
  uploadCompleted: boolean = false;
  notShared: boolean = false;
  showNotSharedPosts: boolean = false;
  isNewPost: boolean = false;
  isCommentOn: boolean = false;

  constructor(
    private fBuilder: FormBuilder,
    private firestoreService: FirestoreService,
    private base: BaseService,
    private auth: AuthService,
    private ngbModal: NgbModal
  ) {}

  ngOnInit(): void {
    this.auth.getUser().then((user: UserClass) => {
      this.userProfilesSub = this.base
        .getUserProfiles()
        .subscribe((userProfiles: UserClass[]) => {
          this.userProfiles = userProfiles;
          this.userProfilesUidsArr = this.userProfiles.map(uP => uP.uid);
          let userProfile = userProfiles.filter(uP => uP.uid === user.uid);
          Object.assign(this.userProfile, ...userProfile);
          this.userProfilesSub.unsubscribe();
        });
    });

    this.publishForm = this.fBuilder.group({
      name: [{ value: this.userProfile.displayName, disabled: true }],
      message: ['', [Validators.required, Validators.minLength(5)]],
      pictures: this.fBuilder.array([]),
      notSeen: [...this.userProfilesUidsArr],
      sharing: ['yes'],
      timeStamp: [''],
      displayName: [this.userProfile.displayName],
      iFrame: [''],
    });

    this.picturesSubscription = this.firestoreService.picturesSubject.subscribe(
      picture => {
        this.picturesArray.push(picture);
      }
    );

    this.picturesSubscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      // this.firestoreService
      //   .getPrivatePosts(this.userProfile.key as string)
      //   .subscribe((privatePosts: any) => (this.privatePosts = privatePosts));
      this.publishForm.patchValue({
        name: this.userProfile.displayName,
        displayName: this.userProfile.displayName,
      });

      this.firestoreService.getMyPosts().then((res: any[]) => {
        this.myPostsArr = res;
        console.log(this.myPostsArr);
        this.getPostsData();
      });
    }, 1000);
  }

  getPostsData() {
    let proba: any[] = [];
    setTimeout(() => {
      const iFrames: NodeListOf<HTMLIFrameElement> = document.querySelectorAll(
        '.iFrame'
      ) as NodeListOf<HTMLIFrameElement>;
      console.log(iFrames);

      this.myPostsArr.forEach((sP, i) => {
        if (sP?.iFrame) {
          const correspondingIframe = Array.from(iFrames).find(
            iframe => iframe.getAttribute('data-post-id') === sP.id
          );
          if (correspondingIframe) {
            correspondingIframe.src = sP.iFrame;
          }
        }
      });

      // this.myPostsArr
      //   .filter(sp => sp.iFrame)
      //   .map((sP, i) => {
      //     console.log(sP);
      //     if (sP?.iFrame && iFrames[i]) {
      //       iFrames[i].src = sP.iFrame;
      //     }
      //   });

      this.myPostsArr.map((sP: any, i: number) => {
        sP.timeStamp = new Date(sP.timeStamp).toLocaleString();
        if (sP.liked?.length) {
          proba = this.userProfiles
            .filter(uP => sP.liked?.includes(uP.uid))
            .map(user => {
              return {
                displayName: user.displayName,
                uid: user.uid,
                postId: sP.id,
              };
            })
            .sort(() => Math.random() - 0.5);
          this.peopleLikedPost.push(proba as any);
        }
        // if (sP.notSeen.includes(this.userProfile.uid)) {
        //   const filteredArr = sP.notSeen.filter(
        //     (uid: any) => uid !== this.userProfile.uid
        //   );
        //   this.firestoreService
        //     .updateDocument(sP.id, {
        //       notSeen: filteredArr,
        //     })
        //     .then(() => this.firestoreService.postsNotiSubject.next(0));
        // }
      });
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.picturesSubscription) this.picturesSubscription.unsubscribe();
    if (this.userProfilesSub) this.userProfilesSub.unsubscribe();
  }

  filesArrivedForSubject() {
    let fileArr: any[] = [];
    return new Promise((res, rej) => {
      this.picturesSubscription =
        this.firestoreService.picturesSubject.subscribe((picture: any) => {
          this.picturesArray.push(picture);
          fileArr.push(picture);
          const interval = setInterval(() => {
            fileArr.pop();
            if (fileArr.length === 0) {
              res('***SIKERES FÁJLURLLEKÉRÉS***');
              clearInterval(interval);
            }
          }, 700);
        });
    });
  }

  onSubmit() {
    if (!this.chosenFiles) this.postPost();
    if (this.chosenFiles) {
      this.uploadFiles().then(res => {
        console.log(res);
        this.filesArrivedForSubject().then(res => {
          console.log(res);
          this.postPost();
        });
      });
    }
    this.isNewPost = false;
  }

  postPost() {
    const date: Date = new Date();
    const iFrame = this.publishForm.get('iFrame')?.value;
    let modifiedIFrame;
    if (iFrame) {
      if (iFrame?.includes('youtu.be')) {
        modifiedIFrame = iFrame.replace('youtu.be', 'www.youtube.com/embed');
      }
      if (iFrame?.includes('watch?')) {
        modifiedIFrame = iFrame.replace('watch?v=', 'embed/');
      }
      if (iFrame?.includes('shorts')) {
        modifiedIFrame = iFrame.replace(
          'youtube.com/shorts',
          'www.youtube.com/embed'
        );
      }
    }
    this.publishForm.patchValue({
      timeStamp: date.getTime(),
      notSeen: [...this.userProfilesUidsArr],
      iFrame: modifiedIFrame ? modifiedIFrame.trim() : '',
    });

    if (!iFrame) this.publishForm.removeControl('iFrame');
    this.post = this.publishForm.value;
    this.post.pictures = this.picturesArray;
    this.firestoreService.createPost(
      this.post,
      this.notShared,
      this.userProfile.key,
      true
    );
    this.picturesArray = [];
    // if (this.notShared) this.showNotSharedPosts = true;
  }

  like(post: Post, i: number) {
    if (!post?.liked?.includes(this.userProfile.uid)) {
      if (!post.liked?.length)
        this.firestoreService
          .updateDocument(
            post.id,
            {
              liked: [this.userProfile.uid],
            },
            false
          )
          .then(() => {
            this.firestoreService.getMyPosts().then((shPosts: any[]) => {
              this.refreshPost(shPosts, i, post);
            });
          });

      if (post.liked?.length)
        this.firestoreService
          .updateDocument(
            post.id,
            {
              liked: [...post.liked, this.userProfile.uid],
            },
            false
          )
          .then(() => {
            this.firestoreService.getMyPosts().then((shPosts: any[]) => {
              this.refreshPost(shPosts, i, post);
            });
          });
    }
  }

  refreshPost(myPosts: any[], i: number, post: Post) {
    myPosts.sort((a: any, b: any) => {
      if (a.timeStamp > b.timeStamp) return -1;
      else return 1;
    });
    this.myPostsArr[i].liked = myPosts[i].liked;
    let filteredArr: any[] = [];

    this.userProfiles
      .filter(uP => this.myPostsArr[i].liked?.includes(uP.uid))
      .map(user => {
        const obj = {
          displayName: user.displayName,
          uid: user.uid,
          postId: this.myPostsArr[i].id,
        };
        if (!this.peopleLikedPost[i]?.includes(user.uid)) filteredArr.push(obj);
      })
      .sort(() => Math.random() - 0.5);
    this.peopleLikedPost[i] = filteredArr;
  }

  addPictures() {
    const arrayControl = this.fBuilder.control(null);
    (<FormArray>this.publishForm.get('pictures')).controls.push(arrayControl);
  }

  forFormArray() {
    return (<FormArray>this.publishForm.get('pictures')).controls;
  }

  selectedFiles($event: any) {
    (this.publishForm.get('pictures') as FormArray).clear();
    this.chosenFiles = this.fBuilder.control($event.target.files);
    (this.publishForm.get('pictures') as FormArray).push(this.chosenFiles);
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
      reader.readAsDataURL(file);
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
    });
  }

  uploadFiles() {
    return new Promise((res, rej) => {
      const maxWidth = 800;
      const maxHeight = 600;
      const quality = 0.85;
      let fileArr = Array.from(this.publishForm.get('pictures')?.value[0]);
      fileArr.map((file: any) => {
        this.resizeImage(file, maxWidth, maxHeight, quality).then(
          resizedBlob => {
            const resizedFile = new File([resizedBlob], file.name, {
              type: 'image/jpg',
            });
            this.firestoreService
              .addPublicPictures(resizedFile, this.userProfile.key)
              .subscribe(percent => {
                if (percent === 100) {
                  res('***FÁJLOK FELTÖLTÉSE SIKERES***');
                }
              });
          }
        );
      });
    });
  }

  showWhoLikedPost(people: any) {
    const modalRef = this.ngbModal.open(ModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.post = this.peopleLikedPost;
    modalRef.componentInstance.likedPeople = people;
  }

  prepareComment(postId: string) {
    this.comment.postId = postId;
  }

  commentPost(post: Post) {
    this.comment.uid = this.userProfile.uid;
    if (post.comments?.length) {
      post.comments.push(this.comment);
      this.firestoreService
        .updateDocument(post.id, { comments: post.comments }, false)
        .then(() => (this.comment = {}));
    }
    if (!post.comments?.length) {
      post.comments = [this.comment];
      this.firestoreService
        .updateDocument(post.id, { comments: post.comments }, false)
        .then(() => (this.comment = {}));
    }
  }
}
