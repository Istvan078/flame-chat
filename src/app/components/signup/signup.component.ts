import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { ModalComponent } from '../modals/modal/modal.component';

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
    private modalService: NgbModal
  ) {}

  createUserWithEmAndPa() {
    this.authService
      .createUserWithEmAndPa(this.email, this.password)
      .then((user) => {
        this.base
          .addUserData({
            uid: user.user?.uid,
            email: user.user?.email,
          })
          .then((res) => {
           let modal =  document.getElementById("registeredModal")
          modal?.classList.add("modal-dialog-centered")
          })
          .then(() => setTimeout(() => {
            this.router.navigate(['profile/' + user.user?.uid])
          }, 3000) );
      });
  }
}
