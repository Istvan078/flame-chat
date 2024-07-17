import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { Post } from 'src/app/models/post.model';
import { Friends, UserClass } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { ModalComponent } from '../../modals/modal/modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { UtilityService } from 'src/app/services/utility.service';
import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
  animations: [
    trigger('fade-in', [
      state(
        'normal',
        style({
          opacity: 0,
          transfrom: 'translateY(-50%) scale(0)',
          color: 'grey',
        })
      ),
      state(
        'faded-in',
        style({
          opacity: 1,
          transfrom: 'translateY(0) scale(1)',
          color: 'black',
        })
      ),
      transition('normal => faded-in', [
        animate(
          1000,
          keyframes([
            style({
              opacity: 0.3,
              transfrom: 'translateY(-50%) scale(0.3)',
            }),
            style({
              opacity: 0.8,
              transfrom: 'translateY(-30%) scale(0.6)',
            }),
            style({
              opacity: 1,
              transfrom: 'translateY(0) scale(1)',
            }),
          ])
        ),
      ]),
    ]),
  ],
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
  iFrames!: HTMLCollectionOf<HTMLIFrameElement>;
  picturesSubscription!: Subscription;
  userProfilesSub!: Subscription;
  sharedPostsSub!: Subscription;
  uploadCompleted: boolean = false;
  notShared: boolean = false;
  isNewPost: boolean = false;
  isCommentOn: boolean = false;
  pipeRefresh: boolean = false;
  isLoading: boolean = false;
  postIndex: any;
  selectedFriendSub!: Subscription;
  allDataForSubmit: any;

  newsAnimationState: string = 'normal';

  constructor(
    private firestoreService: FirestoreService,
    private base: BaseService,
    private utilityService: UtilityService,
    private ngbModal: NgbModal,
    private http: HttpClient
  ) {}

  startAnimate() {
    setTimeout(() => {
      this.newsAnimationState = 'faded-in';
    }, 100);
    this.newsAnimationState = 'normal';
  }

  async ngOnInit() {
    this.isLoading = true;
    this.selectedFriendSub = this.base.selectedFriendSubject.subscribe(
      async fr => {
        if (fr.friendKey) {
          await this.sendPostNotification(fr);
          console.log('**POSZTMEGOSZTÁS ÉRTESÍTÉS ELKÜLDVE**');
        }
      }
    );
    const AllUserDtlsRes = await this.utilityService.getUserProfiles();
    this.userProfilesSub = AllUserDtlsRes.subscribe(AllUserDtls => {
      this.userProfiles = AllUserDtls.userProfiles;
      this.userProfile = AllUserDtls.userProfile;
      this.userProfilesUidsArr = AllUserDtls.userProfilesUidsArr;
      console.log('ÖSSZES FELHASZNÁLÓ ADAT MEGÉRKEZETT A UTIL SERVICE-TŐL');
      this.userProfilesSub.unsubscribe();
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
    this.isLoading = true;
    this.peopleLikedPost = [];
    const posts = await this.firestoreService.getPosts(false);
    if (posts) this.sharedPosts = posts;

    this.getPostsData();
    this.startAnimate();
    this.isLoading = false;
  }

  refreshTimeStamp() {
    this.sharedPosts.map(sP => {
      sP.timeStamp = new Date(sP.timeStamp).getTime();
    });
    this.pipeRefresh = true;
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
    console.log(entry);
    // if (!entry.isIntersecting) return;
    const target = entry.target;
    target.src = target.dataset.src;
    observer.unobserve(entry.target);
  }

  renderIFrames() {
    // data-src-t csinálni
    // const innerHeight = (window.innerHeight / 10).toString() + 'px';
    new Observable(observer => {
      const interval = setInterval(() => {
        this.iFrames = document.getElementsByClassName(
          'iFrames-for-shared-post'
        ) as HTMLCollectionOf<HTMLIFrameElement>;
        (this.iFrames as any) = Array.from(this.iFrames);
        if (this.iFrames.length) {
          observer.next();
          observer.complete();
          clearInterval(interval);
        }
      }, 5);
    }).subscribe(adat => {
      const imgTargets = document.querySelectorAll(
        '.pics-container img[data-src]'
      );
      console.log(imgTargets);
      const imgObserver = new IntersectionObserver(this.loadImage, {
        root: null,
        threshold: [0],
        rootMargin: '200px', // 100px-el a threshold elérése előtt tölti be a képet
      });
      imgTargets.forEach(img => {
        imgObserver.observe(img);
        // annyiszor fut le a callback ahányszor az img elem interszektálja az options-ben
        // meghatározott root elemet
      });
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
      console.log(sectionOne);
      this.sharedPosts.map(sP => {
        const correspondingIframe = (this.iFrames as any).find(
          (iframe: any) => iframe.getAttribute('data-postid') === sP.id
        );
        if (sP.iFrame) {
          if (!this.iFrames[0]?.src) {
            // setTimeout(() => {
            //   console.log(sectionOne[0]);
            //   if (
            //     sectionOne[0].getBoundingClientRect().top <
            //       window.innerHeight ||
            //     sectionOne[1].getBoundingClientRect().top < window.innerHeight
            //   ) {
            //     sectionOne[0].classList.remove('section-hidden');
            //     sectionOne[1].classList.remove('section-hidden');
            //   }
            // }, 1);
            this.iFrames[0].src = sP.iFrame;
          }
          if (
            !this.iFrames[1]?.src &&
            sP.id === this.iFrames[1]?.dataset['postid']
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
    this.renderIFrames();
    const subscription = new Observable(obs => {
      const interval = setInterval(() => {
        if (this.sharedPosts.length) {
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
          clearInterval(interval);
          subscription.unsubscribe();
        }
        console.log(`INTERVAL LEFUTOTT`);
      }, 200);
    }).subscribe();
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

  onSubmit(allDataForSubmit: any) {
    this.allDataForSubmit = allDataForSubmit;
    if (!this.allDataForSubmit.chosenFiles) this.postPost();
    if (this.allDataForSubmit.chosenFiles) {
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
    const iFrame = this.allDataForSubmit.form.get('iFrame')?.value;
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
    this.allDataForSubmit.form.patchValue({
      timeStamp: date.getTime(),
      notSeen: [...this.userProfilesUidsArr],
      iFrame: modifiedIFrame ? modifiedIFrame.trim() : '',
    });

    if (!iFrame) this.allDataForSubmit.form.removeControl('iFrame');
    this.post = this.allDataForSubmit.form.value;
    this.post.pictures = this.picturesArray;
    this.post.userKey = this.userProfile.key;
    this.post.private = {
      isPrivate: false,
    };
    const postRef = await this.firestoreService.createPost(this.post);
    await this.firestoreService.updatePost(postRef.id, { id: postRef.id });
    this.picturesArray = [];
    this.allDataForSubmit.form.reset();
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
      let fileArr = Array.from(
        this.allDataForSubmit.form.get('pictures')?.value[0]
      );
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
