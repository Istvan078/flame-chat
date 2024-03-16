import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { ModalComponent } from '../modals/modal/modal.component';
import { UserClass } from 'src/app/models/user.model';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  @ViewChild('f') signupForm!: NgForm;
  email: string = '';
  password: string = '';
  isLoggedIn: any;
  genders: string[] = ['Férfi', 'Nő'];
  userProfiles: any;
  genderr: any;
  user: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private base: BaseService,
    private modalRef: NgbModal
  ) {}

  createUserWithEmAndPa() {
    this.authService
      .createUserWithEmAndPa(this.email, this.password)
      .then((usr) => {
        this.base.addUserData({
          uid: usr.user?.uid,
          email: usr.user?.email,
        });
        usr.user?.sendEmailVerification();
        return usr.user;
      })
      .then((usr) => {
        const actModal = this.modalRef.open(ModalComponent, {
          centered: true,
        });
        actModal.componentInstance.userEmail = usr?.email;
      })
      .then(() => {
        this.authService.signOut().then(() => {
          this.authService.userLoggedInSubject.next(new UserClass())
          this.router.navigate(['login'])
        });
      });
  }
}
