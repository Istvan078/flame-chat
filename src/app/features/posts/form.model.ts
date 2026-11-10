import { FormGroup } from '@angular/forms';

export class Form {
  input: {
    type?: string;
    formControlName: string;
  };
  formGroup?: FormGroup;
  constructor(
    public label: string,
    public matIcon?: string,
    public textArea?: boolean
  ) {
    this.input = {
      type: 'text',
      formControlName: '',
    };
    this.textArea = false;
  }
}
