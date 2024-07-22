import { Component, inject, input, output } from '@angular/core';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  notConfirmedSignedMe = input<boolean>();
  confirmedFriend = output<string>();
  toastService = inject(ToastService);
  confirmFriend(activeToast: NgbToast) {
    this.confirmedFriend.emit(activeToast.header);
    activeToast.hide();
  }
}
