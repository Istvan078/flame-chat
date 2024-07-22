import {
  AfterContentInit,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserClass } from 'src/app/models/user.model';
import { Form } from 'src/app/models/utils/form.model';
import { UtilityService } from 'src/app/services/utility.service';

@Component({
  selector: "'app-posts', 'form[appPosts]'",
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.scss',
})
export class PostsComponent implements OnInit, AfterContentInit {
  @ViewChild('ngcontent') ngcontent: any;
  FormData = input<Form[]>();
  // @HostBinding('formGroup') formGroup: any;
  submitForm = output();
  AllFormData = signal<Form[]>([]);
  utilService = inject(UtilityService);
  fBuilder = inject(FormBuilder);
  publishForm!: FormGroup;
  userProfile: UserClass = new UserClass();
  userProfilesUidsArr: string[] = [];
  chosenFiles: any;
  onSubmit = output<any>();
  notShared = false;
  userProfilesSub?: Subscription;
  onDestroyRef = inject(DestroyRef);

  async ngOnInit() {
    setTimeout(() => {
      this.publishForm.patchValue({
        name: this.userProfile.displayName,
        displayName: this.userProfile.displayName,
      });
    }, 1000);
    const obs = await this.utilService.getUserProfiles();
    this.userProfilesSub = obs.subscribe(uProfs => {
      (this.userProfile = uProfs.userProfile),
        (this.userProfilesUidsArr = uProfs.userProfilesUidsArr);
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
    this.AllFormData.set(this.utilService.getFormDataForPosts());
    console.log(this.AllFormData);
    // console.log(this.formGroup);
    // setTimeout(() => {
    //   this.formGroup = this.FormData()![0].formGroup;
    // }, 2000);
    this.onDestroyRef.onDestroy(() => {
      if (this.userProfilesSub) this.userProfilesSub?.unsubscribe();
    });
  }

  ngAfterContentInit(): void {
    console.log(this.ngcontent);
  }
  addPictures(event: any) {
    this.chosenFiles = this.fBuilder.control(event.target.files);
    (this.publishForm.get('pictures') as FormArray).clear();
    (this.publishForm.get('pictures') as FormArray).push(this.chosenFiles);
    this.chosenFiles = Array.from(this.chosenFiles.value);
  }

  // forFormArray() {
  //   return (<FormArray>this.publishForm.get('pictures')).controls;
  // }

  // selectedFiles($event: any) {
  //   (this.publishForm.get('pictures') as FormArray).clear();
  //   this.chosenFiles = this.fBuilder.control($event.target.files);
  //   (this.publishForm.get('pictures') as FormArray).push(this.chosenFiles);
  // }
  onFormSubmit() {
    const all = {
      chosenFiles: this.chosenFiles,
      form: this.publishForm,
    };

    this.onSubmit.emit(all);
  }
}
