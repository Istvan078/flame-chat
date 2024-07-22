import { Injectable } from '@angular/core';
import { NgbToastOptions } from '@ng-bootstrap/ng-bootstrap/toast/toast-config';

export interface ToastInfo {
  header: string;
  body: string;
  delay?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts: any[] = [];

  constructor() {}

  addToast(header: string, body: string, options?: NgbToastOptions) {
    this.toasts.push({ header, body, options });
  }

  removeToast(toast: any) {
    this.toasts = this.toasts.filter(t => t.header !== toast.header);
  }
}
