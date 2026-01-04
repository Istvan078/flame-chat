import { Component, ViewChild } from '@angular/core';
import { PhoneAuthProvider } from '@angular/fire/auth';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { ModalComponent } from '../modals/modal/modal.component';
import { UtilityService } from 'src/app/services/utility.service';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [SharedModule],
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
    private modalRef: NgbModal,
    private utilService: UtilityService
  ) {}

  loginWithEmAndPa() {
    this.authService.loginWithEmAndPa(this.email, this.password).catch(err => {
      err.message = 'Hibás e-mail cím, vagy jelszó, kérlek próbáld újra!';
      this.modalRef.open(ModalComponent, {
        centered: true,
      }).componentInstance.error = err;
    });

    this.authService.isLoggedIn().subscribe(user => {
      if (!user?.emailVerified) {
        user
          ?.sendEmailVerification()
          .then(() => {
            this.modalRef.dismissAll();
            const actModal = this.modalRef.open(ModalComponent, {
              centered: true,
            });
            actModal.componentInstance.userEmail = user.email;
          })
          .then(async () => {
            await this.authService.signOut();
            this.authService.userLoggedInSubject.next(new UserClass());
          })
          .catch(err => console.log(err));
      }

      if (user?.emailVerified) {
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
            if (userProfile[0]?.uid) {
              this.utilService.forUserSubject.userProfile = userProfile[0];
              this.utilService.forUserSubject.userProfiles = this.userProfiles;
              this.utilService.getFriends().subscribe();
              document.location.reload();
            }
            if (
              userProfile[0].birthDate === undefined ||
              (userProfile[0].birthDate === '' && user?.emailVerified === true)
            ) {
              this.router.navigate(['/profile/' + user?.uid]);
            } else if (
              userProfile[0].birthDate &&
              user?.emailVerified === true
            ) {
              this.authService.userLoggedInSubject.next(user);
              this.router.navigate(['/chat']);
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

            let userProfile = this.userProfiles.find(
              (userProfile: any) => userProfile.uid === user.uid
            );
            if (userProfile?.uid) {
              this.utilService.forUserSubject.userProfile = userProfile;
              this.utilService.forUserSubject.userProfiles = this.userProfiles;
              this.utilService.getFriends().subscribe();
              document.location.reload();
            }

            if (!userProfile?.uid) {
              userProfile = user;
              for (let i = 0; i < 1; i++) {
                this.base.addUserData({
                  uid: userProfile.uid,
                  email: user.email,
                });
              }
            }
            if (!userProfile?.birthDate) {
              this.router.navigate(['/profile/' + user.uid]);
            } else {
              this.router.navigate(['/chat']);
            }
          });
        }
      });
    });
  }

  startLoginWithPhoneNumber() {
    this.authService.signInWithPhoneNumber(this.phoneNumber).then(result => {
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
          let userProfile = userProfiles.find(
            (userProf: UserClass) => userProf.uid === user.uid
          );
          if (!userProfile?.uid) {
            userProfile = user;
            this.base.addUserData({
              uid: user.uid,
              phoneNumber: user.phoneNumber,
            });
          } else {
            this.utilService.forUserSubject.userProfile = userProfile;
            this.utilService.getFriends().subscribe();
          }
          if (!userProfile['birthDate']) {
            this.router.navigate(['/profile/' + user.uid]);
          } else {
            this.router.navigate(['/chat']);
          }
        });
      });
    });
  }
}
