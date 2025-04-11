import { Component } from '@angular/core';
import { MyPost, Post } from 'src/app/models/post.model';
import { ModalComponent } from '../../modals/modal/modal.component';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Friends, UserClass } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UtilityService } from 'src/app/services/utility.service';
import { MatDialog } from '@angular/material/dialog';
import { MatModalComponent } from '../../modals/mat-modal/mat-modal.component';

@Component({
  selector: 'app-my-posts',
  templateUrl: './my-posts.component.html',
  styleUrls: ['./my-posts.component.scss'],
})
export class MyPostsComponent {
  submitButtonValue: any;
  sharedPictures: any[] = [];
  post!: Post;
  myPost?: MyPost;
  publishForm!: FormGroup;
  chosenFiles: any;
  comment: any = {};
  userProfile: UserClass = new UserClass();
  userProfilesUidsArr: Partial<UserClass[]> | any[] = [];
  userProfiles: UserClass[] = [];
  userFriends: Friends[] = [];
  uploadedPictures: any[] = [];
  picturesArray: any[] = [];
  sharedPosts: Post[] = [];
  myPostsArr: Post[] = [];
  privatePosts: Post[] = [];
  peopleLikedPost: any[] = [];
  postSharedWithMe: any[] = [];
  iFrames: any;
  picturesSubscription!: Subscription;
  userProfilesSub!: Subscription;
  isNavigatedToPostsSub!: Subscription;
  uploadCompleted: boolean = false;
  notShared: boolean = false;
  showNotSharedPosts: boolean = false;
  isNewPost: boolean = false;
  isCommentOn: boolean = false;
  isOnMyPostRoute: boolean = false;
  isActivatedRoute: boolean = false;
  isLoading: boolean = false;

  constructor(
    private fBuilder: FormBuilder,
    private firestoreService: FirestoreService,
    private base: BaseService,
    private ngbModal: NgbModal,
    private route: ActivatedRoute,
    private utilService: UtilityService,
    private matDialog: MatDialog
  ) {}

  async ngOnInit() {
    this.isLoading = true;
    this.route.url.subscribe(urlSegm => {
      if (urlSegm.length) {
        const [{ path }] = urlSegm;
        if (path === 'my-posts') this.isOnMyPostRoute = true;
      }
    });
    const AllUserDtlsRes = await this.utilService.getUserProfiles();
    this.userProfilesSub = AllUserDtlsRes.subscribe(AllUserDtls => {
      this.userProfiles = AllUserDtls.userProfiles;
      this.userProfile = AllUserDtls.userProfile;
      this.userProfilesUidsArr = AllUserDtls.userProfilesUidsArr;
      this.userFriends = AllUserDtls.userFriends!;
      console.log('ÖSSZES FELHASZNÁLÓ ADAT MEGÉRKEZETT A UTIL SERVICE-TŐL');
      this.userProfilesSub.unsubscribe();
    });

    this.publishForm = this.fBuilder.group({
      name: [{ value: this.userProfile.displayName, disabled: true }],
      message: ['', [Validators.required, Validators.minLength(5)]],
      pictures: new FormArray([]),
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

  ngAfterViewInit() {
    setTimeout(async () => {
      this.publishForm.patchValue({
        name: this.userProfile.displayName,
        displayName: this.userProfile.displayName,
      });
      this.route.params.subscribe(async par => {
        this.isActivatedRoute = true;
        await this.init();
      });

      // if (!this.isActivatedRoute) this.init();
      this.firestoreService.getMyPostsSub().subscribe(async getPosts => {
        if (getPosts.isGetMyPosts) {
          await this.init();
          console.log(`***POSZTOK INICIALIZÁLVA***`);
          // this.firestoreService.getMyPostsSub().next();
        }
        // else this.firestoreService.getMyPostsSub().unsubscribe();
      });
    }, 1000);
  }

  async init() {
    this.isLoading = true;
    this.peopleLikedPost = [];
    const myPosts = await this.firestoreService.getPosts(
      true,
      this.userProfile.key
    );
    if (myPosts) this.myPostsArr = myPosts;
    this.getPostsData();
    this.postSharedWithMe = await this.firestoreService.getMyPosts(
      this.userProfile.key
    );

    this.myPostsArr.forEach((myPost, i) => {
      const postSharedWithMe = this.postSharedWithMe.find(
        psWithMe => psWithMe.fromPostId === myPost.id
      );
      if (postSharedWithMe) {
        const sharedWithMeBy = myPost.sharedWith?.find(
          sWithMe => sWithMe.myKey === this.userProfile.key
        );
        const sharerFriendProfile = this.userFriends.find(
          fr => fr.friendKey === sharedWithMeBy?.byWhoKey
        );
        if (sharedWithMeBy) myPost.displayName = '';
        const index = this.postSharedWithMe.findIndex(
          post => post.fromPostId === myPost.id
        );
        this.postSharedWithMe[index].sharedWithMeBy =
          sharerFriendProfile?.displayName;
        if (sharedWithMeBy)
          this.postSharedWithMe[index].timeStamp = new Date(
            sharedWithMeBy.timeStamp
          ).toLocaleString();
      }
    });
    this.postSharedWithMe.forEach(async post => {
      if (post?.seen === false) {
        post.seen = true;
        await this.firestoreService.updateMyPost(
          this.userProfile.key,
          post.id,
          {
            seen: true,
          }
        );
        this.firestoreService.getMyPostsNotiSubj().next(0);
      }
    });
    this.isLoading = false;
  }

  loadImage(entries: any, observer: any) {
    const [entry] = entries;
    // src-t átállítom a data-src-ra ha eléri a képet a scrollpozíció
    if (!entry.isIntersecting) return;
    entry.target.src = entry.target.dataset.src;
    entry.target.addEventListener('load', (e: any) => {
      e.target.classList.remove('lazy-img');
    });
    observer.unobserve(entry.target);
  }

  loadIFrames(entries: any, observer: IntersectionObserver) {
    const [entry] = entries;
    // if (!entry.isIntersecting) return;
    const target = entry.target;
    target.src = target.dataset.src;
    observer.unobserve(entry.target);
  }

  renderImages() {
    const sub = new Observable(observer => {
      const interval = setInterval(() => {
        const imgTargets = document.querySelectorAll(
          '.my-posts-pics-container img[data-src]'
        );
        if (imgTargets.length) {
          observer.next(imgTargets);
          observer.complete();
          clearInterval(interval);
        }
      }, 5);
    }).subscribe((imgTargets: any) => {
      const imgObserver = new IntersectionObserver(this.loadImage, {
        root: null,
        threshold: [0],
        rootMargin: '200px', // 100px-el a threshold elérése előtt tölti be a képet
      });

      imgTargets.forEach((img: any) => {
        if (imgTargets[0]) {
          imgTargets[0].src = imgTargets[0].dataset.src;
          imgTargets[0].classList.remove('lazy-img');
        }
        if (imgTargets[1]) {
          imgTargets[1].src = imgTargets[1].dataset.src;
          imgTargets[1].classList.remove('lazy-img');
        }
        imgObserver.observe(img);
        // annyiszor fut le a callback ahányszor az img elem interszektálja az options-ben
        // meghatározott root elemet
      });
      sub.unsubscribe();
    });
  }

  renderIFrames() {
    // data-src-t csinálni
    // const innerHeight = (window.innerHeight / 10).toString() + 'px';
    new Observable(observer => {
      const interval = setInterval(() => {
        this.iFrames = document.getElementsByClassName(
          'iFrames-for-my-posts'
        ) as HTMLCollectionOf<HTMLIFrameElement>;
        (this.iFrames as any) = Array.from(this.iFrames);
        if (this.iFrames.length) {
          observer.next(null);
          observer.complete();
          clearInterval(interval);
        }
      }, 5);
    }).subscribe(adat => {
      const sectionObserver = new IntersectionObserver(
        (entries, obs) => {
          const [entry] = entries;
          if (!entry.isIntersecting) return;
          entry.target.classList.remove('section-hidden');
          obs.unobserve(entry.target);
        },
        {
          root: null,
          threshold: 0.1,
          rootMargin: '-100px',
        }
      );
      const sectionOne = document.querySelectorAll('.section-1');
      sectionOne.forEach((section, i) => {
        sectionObserver.observe(section);
        section.classList.add('section-hidden');
      });
      this.myPostsArr.map(sP => {
        const correspondingIframe = (this.iFrames as any).find(
          (iframe: any) => iframe.getAttribute('data-postid') === sP.id
        );
        if (sP.iFrame) {
          if (!this.iFrames[0]?.src) {
            setTimeout(() => {
              if (
                sectionOne[0]?.getBoundingClientRect().top <
                  window.innerHeight ||
                sectionOne[1]?.getBoundingClientRect().top < window.innerHeight
              ) {
                sectionOne[0]?.classList.remove('section-hidden');
                sectionOne[1]?.classList.remove('section-hidden');
              }
            }, 1);
            this.iFrames[0].src = sP.iFrame;
          }
          if (
            !this.iFrames[1]?.src &&
            sP.id === this.iFrames[1]?.dataset.postid
          ) {
            this.iFrames[1].src = sP.iFrame;
          }
          (correspondingIframe as HTMLIFrameElement).dataset['src'] = sP.iFrame;
        }
      });
      const iFrameObserver = new IntersectionObserver(this.loadIFrames, {
        root: null, // a célpont elemet a teljes viewporton figyeli hogy interszektál-e
        threshold: 0,
        rootMargin: '200px',
      });
      (this.iFrames as any)?.forEach((iFrame: HTMLIFrameElement) =>
        iFrameObserver.observe(iFrame)
      );
    });
  }

  getPostsData() {
    let proba: any[] = [];
    this.renderImages();
    this.renderIFrames();
    this.myPostsArr.map(myPost => {
      if (myPost.sharedWith?.length)
        myPost.sharedWith.map(sWithMe => {
          if (sWithMe.myKey === this.userProfile.key) {
            myPost['isSharedWithMe'] = true;
            if (myPost.timeStamp > sWithMe.timeStamp) {
              myPost.newestTimeStamp = myPost.timeStamp;
            }
            if (sWithMe.timeStamp > myPost.timeStamp) {
              myPost.newestTimeStamp = sWithMe.timeStamp;
            }
          }
        });
      if (!myPost.isSharedWithMe) {
        myPost.newestTimeStamp = myPost.timeStamp;
      }
    });
    this.myPostsArr.sort((a: any, b: any) => {
      if (a.newestTimeStamp > b.newestTimeStamp)
        return -1; // Csökkenő sorrendbe rendezés
      else return 1;
    });

    this.myPostsArr.map((sP: any, i: number) => {
      sP.timeStamp = new Date(sP.timeStamp).toLocaleString();
      if (sP.liked?.length && !this.post?.id) {
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
    });
    this.post = new Post();
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
              this.picturesSubscription.unsubscribe();
              res('***SIKERES FÁJLURLLEKÉRÉS***');
              clearInterval(interval);
            }
          }, 700);
        });
    });
  }

  onSubmit() {
    console.log(this.chosenFiles);
    if (!this.chosenFiles) this.postPost();
    if (this.chosenFiles) {
      console.log(`EZ FUTOTT LE`);
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
      if (iFrame?.includes('persist_app')) {
        const indexForSlice = iFrame.indexOf('&');
        modifiedIFrame = iFrame.slice(0, indexForSlice);
      }
    }
    this.publishForm.patchValue({
      timeStamp: date.getTime(),
      notSeen: [...this.userProfilesUidsArr],
      iFrame: modifiedIFrame ? modifiedIFrame.trim() : '',
    });

    // if (!iFrame) this.publishForm.removeControl('iFrame');
    this.post = this.publishForm.value;
    this.post.userKey = this.userProfile.key;
    if (!this.notShared)
      this.post.private = {
        isPrivate: false,
      };
    if (this.notShared) {
      this.post.private = {
        isPrivate: true,
        sharedByKey: this.userProfile.key,
      };
      this.post.notSeen = [];
    }
    this.post.pictures = this.picturesArray;
    const postRef = await this.firestoreService.createPost(this.post);
    await this.firestoreService.updatePost(postRef.id, { id: postRef.id });
    if (this.post.private.isPrivate) {
      this.myPost = new MyPost();
      if (postRef.id) this.myPost.fromPostId = postRef.id;
      this.myPost.seen = true;
      const myPost = { ...this.myPost };
      const myPostRef = await this.firestoreService.createMyPost(
        myPost,
        this.userProfile.key
      );
      await this.firestoreService.updateMyPost(
        this.userProfile.key,
        myPostRef.id,
        { id: myPostRef.id }
      );
      this.post.id = postRef.id;
      this.myPostsArr.unshift(this.post);
      this.getPostsData();
      this.post.id = postRef.id;
    }
    if (!this.post.private.isPrivate && !this.post.id) {
      this.picturesArray = [];
      this.chosenFiles = undefined;
      this.post.id = postRef.id;
      this.myPostsArr.unshift(this.post);
      this.getPostsData();
    }
    const matDialogRef = this.matDialog.open(MatModalComponent, {
      enterAnimationDuration: 1000,
    });
    matDialogRef.componentInstance.isPosted = true;
    this.picturesArray = [];
    this.chosenFiles = undefined;
    this.publishForm.reset();
  }

  async like(post: Post, i: number) {
    const posts = await this.firestoreService.getPosts(
      true,
      this.userProfile.key
    );
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
        const postsAfterLike = await this.firestoreService.getPosts(
          true,
          this.userProfile.key
        );
        if (postsAfterLike) this.refreshPost(postsAfterLike, i);
      }
  }

  refreshPost(myPosts: any[], i: number) {
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
        filteredArr.push(obj);
      });

    this.peopleLikedPost.map((person, ind, arr) => {
      if (person[0]?.postId === filteredArr[0].postId) {
        arr.splice(ind, 1);
        arr.push(['DUMMY TEXT']);
      }
      if (ind === arr.length - 1) {
        if (person[0]?.postId !== filteredArr[0].postId)
          this.peopleLikedPost.push(filteredArr);
        person.sort(() => Math.random() - 0.5);
      }
    });
  }

  addPictures(event: any) {
    this.chosenFiles = this.fBuilder.control(event.target.files);
    (this.publishForm.get('pictures') as FormArray).clear();
    (this.publishForm.get('pictures') as FormArray).push(this.chosenFiles);
    this.chosenFiles = Array.from(this.chosenFiles.value);
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

  ngOnDestroy(): void {
    if (this.picturesSubscription) this.picturesSubscription.unsubscribe();
    if (this.userProfilesSub) this.userProfilesSub.unsubscribe();
    if (this.isNavigatedToPostsSub) this.isNavigatedToPostsSub.unsubscribe();
  }

  // moveDoc() {
  //   const fromPath = `users/posts/private/${this.userProfile.key}/posts`;
  //   const toPath = `users/posts/my-posts/${this.userProfile.key}/my-posts`;
  //   const docId = 'zOzVb6gCMPHn9Y8fzkrf';

  //   this.firestoreService
  //     .moveDocument(fromPath, toPath, docId)
  //     .then(() => {
  //       console.log('Document moved successfully');
  //     })
  //     .catch(error => {
  //       console.error('Error moving document:', error);
  //     });
  // }
}
