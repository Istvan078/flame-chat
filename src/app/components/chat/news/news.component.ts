import { AfterViewInit, Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  NgForm,
  Validators,
} from '@angular/forms';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { FirestoreService } from 'src/app/services/firestore.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
})
export class NewsComponent implements OnInit, AfterViewInit {
  recipeForm: any;
  submitButtonValue: any;
  sharedPictures: any[] = []
  onSubmit() {
    console.log(this.publishForm.value);

  }
  publishForm!: FormGroup;
  chosenFiles: any;
  userProfile: UserClass = new UserClass();

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
    });

    
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.firestoreService.getPictures(this.userProfile.key!)
      .subscribe(
        (res: any[]) => this.sharedPictures = res
      );
      this.publishForm.patchValue({ name: this.userProfile.displayName });
    }, 1000);
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
    console.log(proba);
    proba.forEach((file) => {
      this.firestoreService.addPictures(file, this.userProfile.key);
    });
  }
}
