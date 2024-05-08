import { Component, ViewChild } from '@angular/core';
import { PhoneAuthProvider } from '@angular/fire/auth';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { ModalComponent } from '../modals/modal/modal.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  phoneNumber: any;
  verificationCode: any;
  verificationId: any;
  emailOrGoogle: boolean = false;
  facebookOrGoogle: boolean = false;
  isPhone: boolean = false;
  reCapthcaOff: boolean = false;
  userProfiles: any[] = [];
  @ViewChild('loginForm') loginForm!: NgForm;

  constructor(
    private authService: AuthService,
    private router: Router,
    private base: BaseService,
    private modalRef: NgbModal
  ) {}

  loginWithEmAndPa() {
    this.authService.loginWithEmAndPa(this.email, this.password);
    this.authService.isLoggedIn().subscribe((user) => {
      if (!user?.emailVerified) {
        user
          ?.sendEmailVerification()
          .then(() => {
            this.modalRef.dismissAll()
           const actModal = this.modalRef.open(ModalComponent, {
              centered: true,
            });
            actModal.componentInstance.userEmail = user.email;
            
          })
          .then(() => {             
            this.authService.signOut().then(() => {
              this.authService.userLoggedInSubject.next(new UserClass());
            });
          });
      }

      if(user?.emailVerified) {
      this.base.getUserProfiles().subscribe((userProfiles: any) => {
        this.userProfiles = userProfiles;

        let userProfile = this.userProfiles.filter(
          (userProfile: any) => userProfile.uid === user?.uid
        );

        this.base.userProfileSubject.next(userProfile);

        if (userProfile.length === 0 && user?.emailVerified) {
          userProfile.push(user);
          for (let i = 0; i < 1; i++) {
            this.base.addUserData({
              uid: userProfile[0].uid,
              email: user?.email,
            });
          }
        }
        if (user?.emailVerified) {
          if (
            userProfile[0].birthDate === undefined ||
            (userProfile[0].birthDate === '' && user?.emailVerified === true)
          ) {
            this.router.navigate(['profile/' + user?.uid]);
          } else if (userProfile[0].birthDate && user?.emailVerified === true) {
            this.authService.userLoggedInSubject.next(user)
            this.router.navigate(['chat']);
          }
        }

      });
    }
    });
  }

  loginWithGoogle(): void {
    this.authService.signInWithGoogle().then(() => {
      this.authService.isLoggedIn().subscribe((user: any) => {
        if (user) {
          this.base.getUserProfiles().subscribe((userProfiles: any) => {
            this.userProfiles = userProfiles;

            let userProfile = this.userProfiles.filter(
              (userProfile: any) => userProfile.uid === user.uid
            );

            if (userProfile.length === 0) {
              userProfile.push(user);
              for (let i = 0; i < 1; i++) {
                this.base.addUserData({
                  uid: userProfile[0].uid,
                  email: user.email,
                });
              }
            }
            if (
              userProfile[0].birthDate === undefined ||
              userProfile[0].birthDate === ''
            ) {
              this.router.navigate(['profile/' + user.uid]);
            } else {
              this.router.navigate(['chat']);
            }
          });
        }
      });
    });
  }

  loginWithFacebook(): void {
    this.authService
      .signInWithFacebook()
      .then(() => this.router.navigate(['']));
  }

  booleanFunction() {
    this.emailOrGoogle = !this.emailOrGoogle;
  }

  startLoginWithPhoneNumber() {
    this.authService
      .signInWithPhoneNumber('+36' + this.phoneNumber)
      .then((result) => {
        this.verificationId = result.verificationId;
        this.reCapthcaOff = true;
      });
  }

  verifyPhoneNumberAndLogin() {
    const credentials = PhoneAuthProvider.credential(
      this.verificationId,
      this.verificationCode
    );
    this.authService.verifyPhoneNumberAndSignIN(credentials).then(() => {
      this.authService.isLoggedIn().subscribe((user: any) => {
        this.base.getUserProfiles().subscribe((userProfiles: any[]) => {
          let userProfile = userProfiles.filter(
            (userProfile: UserClass) => userProfile.uid === user.uid
          );
          if (userProfile.length === 0) {
            userProfile.push(user);
            this.base.addUserData({
              uid: user.uid,
              phoneNumber: user.phoneNumber,
            });
          }
          if (
            userProfile[0]['birthDate'] === undefined ||
            userProfile[0]['birthDate'] === ''
          ) {
            this.router.navigate(['profile/' + user.uid]);
          } else {
            this.router.navigate(['chat']);
          }
        });
      });
    });
  }

  fillSignInValues() {
    this.loginForm.form.patchValue({
      email: 'pelda078@gmail.com',
      password: 'xy',
    });
  }
}
