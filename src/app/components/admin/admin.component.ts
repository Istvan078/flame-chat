import { Component, inject, Input, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { MyPost, Post } from 'src/app/models/post.model';
import { Friends, UserClass } from 'src/app/models/user.model';
import { FirestoreService } from 'src/app/services/firestore.service';
import { UtilityService } from 'src/app/services/utility.service';
import { ModalComponent } from '../modals/modal/modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  utilService = inject(UtilityService);
  firestoreService = inject(FirestoreService);
  ngbModal = inject(NgbModal);
  authService = inject(AuthService);

  userProfile: UserClass = new UserClass();
  userProfilesUidsArr: Partial<UserClass[]> | any[] = [];
  userProfiles: UserClass[] = [];
  userProfilesSub!: Subscription;

  submitButtonValue: any;
  sharedPictures: any[] = [];
  post!: Post;
  chosenFiles: any;
  comment: any = {};
  @Input() userFriends: Friends[] = [];
  uploadedPictures: any[] = [];
  picturesArray: any[] = [];
  sharedPosts: Post[] = [];
  myPostsArr: Post[] = [];
  privatePosts: Post[] = [];
  peopleLikedPost: any[] = [];
  postSharedWithMe: any[] = [];
  myPrivatePosts: any[] = [];
  iFrames: any;
  picturesSubscription!: Subscription;
  isNavigatedToPostsSub!: Subscription;
  uploadCompleted: boolean = false;
  notShared: boolean = false;
  showNotSharedPosts: boolean = false;
  isNewPost: boolean = false;
  isCommentOn: boolean = false;
  isOnMyPostRoute: boolean = false;
  isActivatedRoute: boolean = false;

  async ngOnInit() {
    const AllUserDtlsRes = await this.utilService.getUserProfiles();
    this.userProfilesSub = AllUserDtlsRes.subscribe(AllUserDtls => {
      this.userProfiles = AllUserDtls.userProfiles;
      this.userProfile = AllUserDtls.userProfile;
      this.userProfilesUidsArr = AllUserDtls.userProfilesUidsArr;
      console.log('ÖSSZES FELHASZNÁLÓ ADAT MEGÉRKEZETT A UTIL SERVICE-TŐL');
      this.init();
      this.userProfilesSub.unsubscribe();
    });
  }

  async init() {
    const posts = await this.firestoreService.getPosts(false);
    if (posts) this.sharedPosts = posts;
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
    const myPrivatePosts = await this.firestoreService.getMyPosts(
      this.userProfile.key
    );
    this.myPrivatePosts = myPrivatePosts;
    this.myPostsArr.forEach((myPost, i) => {
      const postSharedWithMe = this.postSharedWithMe.find(
        psWithMe => psWithMe.fromPostId === myPost.id
      );
      if (postSharedWithMe) {
        const sharedWithMeBy = myPost.sharedWith?.find(
          (sWithMe: any) => sWithMe.myKey === this.userProfile.key
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

    const imgTargets = document.querySelectorAll(
      '.pics-container img[data-src]'
    );
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
  }

  getPostsData() {
    let proba: any[] = [];
    this.renderIFrames();
    this.myPostsArr.map(myPost => {
      if (myPost.sharedWith?.length)
        myPost.sharedWith.map((sWithMe: any) => {
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
    });
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
          observer.next();
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

  showWhoLikedPost(people: any) {
    const modalRef = this.ngbModal.open(ModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.post = this.peopleLikedPost;
    modalRef.componentInstance.likedPeople = people;
  }
  deletePost(post: any) {
    if (post.userKey)
      this.firestoreService.deletePost(post.id, this.userProfile.key);
    if (post.fromPostId)
      this.firestoreService.deletePost(
        post.fromPostId,
        this.userProfile.key,
        post.id as string
      );
    if (post.pictures?.length && post.fromPostId)
      this.firestoreService.deletePost(
        post.fromPostId,
        this.userProfile.key,
        post.id as string,
        (post as any)?.pictures[0]?.name
      );

    if (post.pictures?.length && post.userKey)
      this.firestoreService.deletePost(
        post.id,
        this.userProfile.key,
        (post as any)?.pictures[0]?.name
      );
  }
  showNavAgain() {
    this.authService.navDisappear.next(false);
  }
}
