import { Injectable } from '@angular/core';
import { Form } from './form.model';

@Injectable({
  providedIn: 'root',
})
export class PostFormService {
  postsFormData: Form[] = [
    {
      label: 'Név',
      matIcon: 'person',
      input: {
        formControlName: 'name',
      },
    },
    {
      textArea: true,
      label: 'Bejegyzés szövege',
      input: { formControlName: 'message' },
    },
    {
      label: 'Youtube link',
      input: { formControlName: 'iFrame' },
    },
  ];

  getFormDataForPosts() {
    return this.postsFormData;
  }
}
