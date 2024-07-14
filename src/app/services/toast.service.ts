import { Injectable } from '@angular/core';

export interface ToastInfo {
  header: string;
  body: string;
  delay?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts: ToastInfo[] = [];

  constructor() {}

  addToast(header: string, body: string) {
    this.toasts.push({ header, body });
  }

  removeToast(toast: ToastInfo) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }
}
