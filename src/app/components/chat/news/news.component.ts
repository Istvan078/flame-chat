import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {  Subscription } from 'rxjs';
import { Post } from 'src/app/models/post.model';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { FirestoreService } from 'src/app/services/firestore.service';

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
  uploadedPictures: any[] = [];
  picturesArray: any[] = [];
  sharedPosts: Post[] = [];
  privatePosts: Post[] = [];
  picturesSubscription!: Subscription;
  uploadCompleted: boolean = false;
  notShared: boolean = false;
  showNotSharedPosts: boolean = false;

  constructor(
    private fBuilder: FormBuilder,
    private firestoreService: FirestoreService,
    private base: BaseService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.auth.getUserSubject().then((user: UserClass) => {
      this.base.getUserProfiles().subscribe((userProfiles: UserClass[]) => {
        let userProfile = userProfiles.filter((uP) => uP.uid === user.uid);
        Object.assign(this.userProfile, ...userProfile);
        console.log(this.userProfile);
      });
    });

    this.publishForm = this.fBuilder.group({
      name: [{ value: this.userProfile.displayName, disabled: true }],
      message: ['', [Validators.required, Validators.minLength(5)]],
      pictures: this.fBuilder.array([]),
      sharing: ['yes'],
      timeStamp: [new Date().toLocaleTimeString()],
      displayName: [this.userProfile.displayName]
    });

    this.picturesSubscription = this.firestoreService.picturesSubject.subscribe(
      (picture) => {
        this.picturesArray.push(picture);
      }
    );

    this.picturesSubscription.unsubscribe();

    this.picturesSubscription = this.firestoreService.picturesSubject.subscribe(
      (picture) => {
        this.picturesArray.push(picture);
      }
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.firestoreService.getPrivatePosts(this.userProfile.key as string)
      .subscribe(
        (privatePosts: any) => this.privatePosts = privatePosts
      )

      this.firestoreService.getSharedPosts().subscribe((res: any[]) => {
        this.sharedPosts = res;
        console.log(this.sharedPictures);
      });
      this.publishForm.patchValue({ name: this.userProfile.displayName , displayName: this.userProfile.displayName});
    }, 1000);
  }

  ngOnDestroy(): void {
    this.picturesSubscription.unsubscribe();
  }

  onSubmit() {
    if (this.chosenFiles) {
      this.uploadFiles();
    }
    setTimeout(() => {
      this.privatePost = this.publishForm.value;
      this.privatePost.pictures = this.picturesArray;
      console.log(this.picturesArray);
      this.firestoreService.createPost(this.privatePost, this.notShared, this.userProfile.key);
      this.picturesArray = [];
      if(this.notShared) this.showNotSharedPosts = true
    }, 3000);
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
    proba.map((file) =>
      this.firestoreService
        .addPublicPictures(file)
        .subscribe((percent) => console.log(percent))
    );
  }
}
