import { HttpClient } from '@angular/common/http';
import { Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent {
  activeModal = inject(NgbActiveModal);
  @Input() name: string = '';
  @Input() friendName: string = '';
  @Input() userName: string = '';
  @Input() uid: string = '';
  @Input() userEmail: string = '';
  @Input() post: any;
  @Input() likedPeople: any[] = [];
  @Input() error: any;

  usersApiUrl = 'https://us-central1-project0781.cloudfunctions.net/api/';

  constructor(private http: HttpClient) {}

  deleteUser() {
    this.http
      .post(this.usersApiUrl + 'deleteUser', { uid: this.uid })
      .subscribe(res => console.log(res));
  }
}
