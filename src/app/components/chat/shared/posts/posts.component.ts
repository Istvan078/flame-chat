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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SharedModule } from 'src/app/components/shared/shared.module';
import { UserClass } from 'src/app/models/user.model';
import { Form } from 'src/app/models/utils/form.model';
import { UtilityService } from 'src/app/services/utility.service';

@Component({
  selector: "'app-posts', 'form[appPosts]'",
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.scss',
  standalone: true,
  imports: [SharedModule],
})
export class PostsComponent implements OnInit, AfterContentInit {
  @ViewChild('ngcontent') ngcontent: any;
  FormData = input<Form[]>();
  // @HostBinding('formGroup') formGroup: any;
  submitForm = output();
  AllFormData = signal<Form[]>([]);
  utilService = inject(UtilityService);
  fBuilder = inject(FormBuilder);
  publishForm: FormGroup = this.fBuilder.group({
    name: [{ value: '', disabled: true }],
    message: ['', [Validators.required, Validators.minLength(5)]],
    pictures: this.fBuilder.array([]),
    notSeen: this.fBuilder.control<string[]>([]),
    isShared: ['yes'],
    timeStamp: [''],
    displayName: [''],
    iFrame: [''],
  });
  userProfile: UserClass = new UserClass();
  userProfilesUidsArr: string[] = [];
  chosenFiles: any;
  onSubmit = output<any>();
  notShared = false;
  userProfilesSub?: Subscription;
  onDestroyRef = inject(DestroyRef);

  async ngOnInit() {
    this.AllFormData.set(this.utilService.getFormDataForPosts());
    const obs = await this.utilService.getUserProfiles();
    if (this.onDestroyRef.destroyed) return;

    this.userProfilesSub = obs
      .pipe(takeUntilDestroyed(this.onDestroyRef))
      .subscribe(uProfs => {
        this.userProfile = uProfs.userProfile;
        this.userProfilesUidsArr = uProfs.userProfilesUidsArr;
        this.publishForm.patchValue({
          name: this.userProfile.displayName,
          displayName: this.userProfile.displayName,
          notSeen: [...this.userProfilesUidsArr],
        });
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
