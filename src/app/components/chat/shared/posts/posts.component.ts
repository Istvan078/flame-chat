import {
  Component,
  HostBinding,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserClass } from 'src/app/models/user.model';
import { Form } from 'src/app/models/utils/form.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { UtilityService } from 'src/app/services/utility.service';

@Component({
  selector: "'app-posts', 'form[appPosts]'",
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.scss',
})
export class PostsComponent implements OnInit {
  FormData = input<Form[]>();
  // @HostBinding('formGroup') formGroup: any;
  submitForm = output();
  AllFormData = signal<Form[]>([]);
  utilService = inject(UtilityService);

  ngOnInit(): void {
    this.AllFormData.set(this.utilService.getFormDataForPosts());
    console.log(this.FormData());
    // console.log(this.formGroup);
    // setTimeout(() => {
    //   this.formGroup = this.FormData()![0].formGroup;
    // }, 2000);
  }
}
