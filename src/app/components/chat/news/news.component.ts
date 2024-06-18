import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Post } from 'src/app/models/post.model';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { ModalComponent } from '../../modals/modal/modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
})
export class NewsComponent implements OnInit, AfterViewInit, OnDestroy {
  recipeForm: any;
  submitButtonValue: any;
  sharedPictures: any[] = [];
  privatePost!: Post;
  publishForm!: FormGroup;
  chosenFiles: any;
  userProfile: UserClass = new UserClass();
  userProfilesUidsArr: Partial<UserClass[]> | any[] = [];
  userProfiles: UserClass[] = [];
  uploadedPictures: any[] = [];
  picturesArray: any[] = [];
  sharedPosts: Post[] = [];
  privatePosts: Post[] = [];
  peopleLikedPost: any[] = [];
  picturesSubscription!: Subscription;
  uploadCompleted: boolean = false;
  notShared: boolean = false;
  showNotSharedPosts: boolean = false;
  isNewPost: boolean = false;

  constructor(
    private fBuilder: FormBuilder,
    private firestoreService: FirestoreService,
    private base: BaseService,
    private auth: AuthService,
    private ngbModal: NgbModal
  ) {}

  ngOnInit(): void {
    this.auth.getUser().then((user: UserClass) => {
      this.base.getUserProfiles().subscribe((userProfiles: UserClass[]) => {
        this.userProfiles = userProfiles;
        this.userProfilesUidsArr = this.userProfiles.map(uP => uP.uid);
        console.log(this.userProfilesUidsArr);
        let userProfile = userProfiles.filter(uP => uP.uid === user.uid);
        Object.assign(this.userProfile, ...userProfile);
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
    });

    this.picturesSubscription = this.firestoreService.picturesSubject.subscribe(
      picture => {
        this.picturesArray.push(picture);
      }
    );

    this.picturesSubscription.unsubscribe();

    this.picturesSubscription = this.firestoreService.picturesSubject.subscribe(
      picture => {
        this.picturesArray.push(picture);
      }
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.firestoreService
        .getPrivatePosts(this.userProfile.key as string)
        .subscribe((privatePosts: any) => (this.privatePosts = privatePosts));
      this.publishForm.patchValue({
        name: this.userProfile.displayName,
        displayName: this.userProfile.displayName,
      });

      this.firestoreService.getSharedPosts().then((res: any[]) => {
        this.sharedPosts = res;
        console.log(this.sharedPosts);
        let proba: any[] = [];
        this.sharedPosts.map((sP: any) => {
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
          console.log(this.peopleLikedPost);
          if (sP.notSeen.includes(this.userProfile.uid)) {
            const filteredArr = sP.notSeen.filter(
              (uid: any) => uid !== this.userProfile.uid
            );
            console.log(filteredArr);
            this.firestoreService
              .updateDocument(sP.id, {
                notSeen: filteredArr,
              })
              .then(() => this.firestoreService.postsNotiSubject.next(0));
          }
        });
      });
    }, 1000);
  }

  ngOnDestroy(): void {
    this.picturesSubscription.unsubscribe();
  }

  onSubmit() {
    if (this.chosenFiles) {
      this.uploadFiles();
    }
    this.isNewPost = false;
    setTimeout(() => {
      const date: Date = new Date();
      this.publishForm.patchValue({
        timeStamp: date.toLocaleDateString() + ' ' + date.toLocaleTimeString(),
        notSeen: [...this.userProfilesUidsArr],
      });
      this.privatePost = this.publishForm.value;
      this.privatePost.pictures = this.picturesArray;
      this.firestoreService.createPost(
        this.privatePost,
        this.notShared,
        this.userProfile.key
      );
      this.picturesArray = [];
      if (this.notShared) this.showNotSharedPosts = true;
    }, 3000);
  }

  like(post: Post) {
    // this.sharedPosts.map(sP => {
    if (!post?.liked?.includes(this.userProfile.uid)) {
      // const filteredArr = sP.liked.filter(
      //   (uid: any) => uid !== this.userProfile.uid
      // );
      // console.log(filteredArr);
      if (!post.liked?.length)
        this.firestoreService
          .updateDocument(post.id, {
            liked: [this.userProfile.uid],
          })
          .then(() => {
            this.firestoreService.getSharedPosts().then((res: any[]) => {
              this.sharedPosts = res;
            });
          });

      if (post.liked?.length)
        this.firestoreService
          .updateDocument(post.id, {
            liked: [...post.liked, this.userProfile.uid],
          })
          .then(() => {
            this.firestoreService.getSharedPosts().then((res: any[]) => {
              this.sharedPosts = res;
            });
          });
    }
    // .then(() => this.firestoreService.postsNotiSubject.next(0));
    // });
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

  uploadFiles() {
    let proba = Array.from(this.publishForm.get('pictures')?.value[0]);
    proba.map(file =>
      this.firestoreService
        .addPublicPictures(file)
        .subscribe(percent => console.log(percent))
    );
  }

  showWhoLikedPost(people: any) {
    const modalRef = this.ngbModal.open(ModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.post = this.peopleLikedPost;
    modalRef.componentInstance.likedPeople = people;
  }
}
