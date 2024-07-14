import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Post } from 'src/app/models/post.model';
import { Friends, UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { ModalComponent } from '../../modals/modal/modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
})
export class NewsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() userFriends?: Friends[];
  sharedPictures: any[] = [];
  post: Post = new Post();
  publishForm!: FormGroup;
  chosenFiles: any;
  comment: any = {};
  userProfile: UserClass = new UserClass();
  userProfilesUidsArr: Partial<UserClass[]> | any[] = [];
  userProfiles: UserClass[] = [];
  uploadedPictures: any[] = [];
  picturesArray: any[] = [];
  sharedPosts: Post[] = [];
  peopleLikedPost: any[] = [];
  picturesSubscription!: Subscription;
  userProfilesSub!: Subscription;
  sharedPostsSub!: Subscription;
  uploadCompleted: boolean = false;
  notShared: boolean = false;
  isNewPost: boolean = false;
  isCommentOn: boolean = false;
  pipeRefresh: boolean = false;
  postIndex: any;
  selectedFriendSub!: Subscription;

  constructor(
    private fBuilder: FormBuilder,
    private firestoreService: FirestoreService,
    private base: BaseService,
    private auth: AuthService,
    private ngbModal: NgbModal,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.selectedFriendSub = this.base.selectedFriendSubject.subscribe(
      async fr => {
        if (fr.friendKey) {
          await this.sendPostNotification(fr);
          console.log('**POSZTMEGOSZTÁS ÉRTESÍTÉS ELKÜLDVE**');
        }
      }
    );
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
      isShared: ['yes'],
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
    setTimeout(async () => {
      this.publishForm.patchValue({
        name: this.userProfile.displayName,
        displayName: this.userProfile.displayName,
      });
      this.init();
      this.firestoreService.getMyPostsSub().subscribe(async getPosts => {
        if (getPosts.isGetSharedPosts) {
          await this.init();
          console.log(`***POSZTOK INICIALIZÁLVA***`);
        }
        // else this.firestoreService.getMyPostsSub().unsubscribe();
      });
    }, 1000);
  }

  async init() {
    this.peopleLikedPost = [];
    const posts = await this.firestoreService.getPosts(false);
    if (posts) this.sharedPosts = posts;
    this.getPostsData();
  }

  refreshTimeStamp() {
    this.sharedPosts.map(sP => {
      sP.timeStamp = new Date(sP.timeStamp).getTime();
    });
    this.pipeRefresh = true;
  }

  getPostsData() {
    let proba: any[] = [];
    setTimeout(() => {
      const iFrames: HTMLCollectionOf<HTMLIFrameElement> =
        document.getElementsByClassName(
          'iFrames-for-shared-post'
        ) as HTMLCollectionOf<HTMLIFrameElement>;
      this.sharedPosts.map((sP, i, arr) => {
        const correspondingIframe = Array.from(iFrames).find(
          iframe => iframe.getAttribute('data-post-id') === sP.id
        );
        if (sP.iFrame) {
          correspondingIframe!.src = sP.iFrame;
        }
      });

      this.sharedPosts.map((sP: any, i: number) => {
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
        if (sP.notSeen.includes(this.userProfile.uid)) {
          const filteredArr = sP.notSeen.filter(
            (uid: any) => uid !== this.userProfile.uid
          );
          this.firestoreService
            .updateDocument(
              sP.id,
              {
                notSeen: filteredArr,
              },
              true
            )
            .then(() => this.firestoreService.postsNotiSubject.next(0));
        }
      });
    }, 500);
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

  async postPost() {
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
      if (iFrame?.includes('live')) {
        modifiedIFrame = iFrame.replace('live', 'embed');
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
    this.post.userKey = this.userProfile.key;
    this.post.private = {
      isPrivate: false,
    };
    const postRef = await this.firestoreService.createPost(this.post);
    await this.firestoreService.updatePost(postRef.id, { id: postRef.id });
    this.picturesArray = [];
  }

  async like(post: Post, i: number) {
    const posts = await this.firestoreService.getPosts(false);
    if (posts)
      posts.sort((a: any, b: any) => {
        if (a.timeStamp > b.timeStamp) return -1;
        else return 1;
      });
    if (posts)
      if (!posts[i]?.liked?.includes(this.userProfile.uid)) {
        if (!posts[i].liked?.length) {
          await this.firestoreService.updatePost(post.id, {
            liked: [this.userProfile.uid],
          });
        }

        if (posts[i].liked?.length) {
          await this.firestoreService.updatePost(post.id, {
            liked: [...(posts[i].liked as any), this.userProfile.uid],
          });
        }
        const postsAfterLike = await this.firestoreService.getPosts(false);
        if (postsAfterLike) this.refreshPost(postsAfterLike, i);
      }
  }

  refreshPost(sharedPosts: Post[], i: number) {
    sharedPosts.sort((a: any, b: any) => {
      if (a.timeStamp > b.timeStamp) return -1;
      else return 1;
    });
    this.sharedPosts[i].liked = sharedPosts[i].liked;
    let filteredArr: any[] = [];
    this.userProfiles
      .filter(uP => this.sharedPosts[i].liked?.includes(uP.uid))
      .map((user, ind) => {
        const obj = {
          displayName: user.displayName,
          uid: user.uid,
          postId: this.sharedPosts[i].id,
        };
        filteredArr.push(obj);
      });
    this.peopleLikedPost.map((person, ind, arr) => {
      if (person[0]?.postId === filteredArr[0].postId) {
        arr.splice(ind, 1);
        arr.push(['DUMMY TEXT']);
      }
      if (ind === arr.length - 1) {
        if (person[0].postId !== filteredArr[0].postId) {
          this.peopleLikedPost.push(filteredArr);
          person.sort(() => Math.random() - 0.5);
        }
      }
    });
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

  async sendPostNotification(friend: any) {
    const apiUrl = 'https://us-central1-project0781.cloudfunctions.net/api/';
    const promise = new Promise((res, rej) => {
      return this.firestoreService
        .getUserNotiSubscription(friend!.friendKey)
        .subscribe(sub => {
          // this.friendPushSub = sub;
          if (sub !== undefined) {
            return res(sub);
          }
        });
    });
    const friendSubs = await promise;
    console.log(friendSubs);
    const body = {
      post: 'Poszt',
      user: this.userProfile,
      subscriptions: friendSubs,
    };
    this.http.post(`${apiUrl}post`, body).subscribe(res => console.log(res));
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

  async commentPost(post: Post) {
    this.comment.uid = this.userProfile.uid;
    if (post.comments?.length) {
      post.comments.push(this.comment);
      const postUpdated = await this.firestoreService.updatePost(post.id, {
        comments: post.comments,
      });
      this.comment = {};
    }
    if (!post.comments?.length) {
      post.comments = [this.comment];
      const postUpdated = await this.firestoreService.updatePost(post.id, {
        comments: post.comments,
      });
      this.comment = {};
    }
  }

  startPostSharing(post: Post) {
    console.log(post);
    const modalRef = this.ngbModal.open(ModalComponent, { centered: true });
    modalRef.componentInstance.post = post;
    modalRef.componentInstance.user = this.userProfile;
    modalRef.componentInstance.userFriends = this.userFriends;
  }

  ngOnDestroy(): void {
    if (this.picturesSubscription) this.picturesSubscription.unsubscribe();
    if (this.userProfilesSub) this.userProfilesSub.unsubscribe();
    if (this.sharedPostsSub) this.sharedPostsSub.unsubscribe();
    if (this.selectedFriendSub) this.selectedFriendSub.unsubscribe();
    this.peopleLikedPost = [];
  }
}
