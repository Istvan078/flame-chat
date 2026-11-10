import { Component, OnInit, ViewChild } from '@angular/core';
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
import { IonicModule } from '../shared/ionic.module';
import { SelectCustomEvent } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [SharedModule, IonicModule],
})
export class LoginComponent implements OnInit {
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
  lang: string = '';
  @ViewChild('loginForm') loginForm!: NgForm;

  constructor(
    private authService: AuthService,
    private router: Router,
    private base: BaseService,
    private modalRef: NgbModal,
    private utilService: UtilityService,
    private translateService: TranslateService,
  ) {}

  ngOnInit(): void {
    const lang = this.translateService.getCurrentLang();
    this.lang = lang;
  }

  // Change the selected language
  changeLang(event: SelectCustomEvent<string>) {
    const lang = event.detail.value;
    localStorage.setItem('lang', lang);
    this.translateService.use(lang);
  }

  async loginWithEmAndPa() {
    try {
      const userCred = await this.authService.loginWithEmAndPa(
        this.email,
        this.password,
      );
      const user = userCred?.user;
      if (!user?.emailVerified) {
        await user?.sendEmailVerification();
        if (this.modalRef.hasOpenModals()) this.modalRef.dismissAll();
        const actModal = this.modalRef.open(ModalComponent, {
          centered: true,
        });
        if (user?.email) actModal.componentInstance.userEmail = user.email;
        throw new Error('unverified-email');
      }

      if (user?.emailVerified) {
        this.base.getUserProfiles().subscribe((userProfiles: any) => {
          this.userProfiles = userProfiles;

          let userProfile = this.userProfiles.filter(
            (userProfile: any) => userProfile.uid === user?.uid,
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
    } catch (err: any) {
      this.authService.signOut();
      this.authService.userLoggedInSubject.next(new UserClass());
      if (err.message === 'unverified-email') {
        return;
      }
      const badCreds = new Error(
        'Hibás e-mail cím, vagy jelszó, kérlek próbáld újra!',
      );
      if (this.modalRef.hasOpenModals()) this.modalRef.dismissAll();
      this.modalRef.open(ModalComponent, {
        centered: true,
      }).componentInstance.error = badCreds;
    }
  }

  async loginWithGoogle(): Promise<void> {
    const userCreds = await this.authService.signInWithGoogle();
    this.authService.isLoggedIn().subscribe((user: any) => {
      if (user) {
        this.base.getUserProfiles().subscribe((userProfiles: any) => {
          this.userProfiles = userProfiles;

          let userProfile = this.userProfiles.find(
            (userProfile: any) => userProfile.uid === user.uid,
          );
          console.log(userProfile);
          if (userProfile?.uid) {
            this.utilService.forUserSubject.userProfile = userProfile;
            this.utilService.forUserSubject.userProfiles = this.userProfiles;
            this.utilService.getFriends().subscribe();
            document.location.reload();
          }

          if (!userProfile?.uid) {
            userProfile = user;
            this.base.addUserData({
              uid: userProfile.uid,
              email: user.email,
            });
          }
          if (!userProfile?.birthDate) {
            this.router.navigate(['/profile/' + user.uid]);
          } else {
            this.router.navigate(['/chat']);
          }
        });
      }
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
      this.verificationCode,
    );
    this.authService.verifyPhoneNumberAndSignIN(credentials).then(() => {
      this.authService.isLoggedIn().subscribe((user: any) => {
        this.base.getUserProfiles().subscribe((userProfiles: any[]) => {
          let userProfile = userProfiles.find(
            (userProf: UserClass) => userProf.uid === user.uid,
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

  onLogin(type: 'google' | 'email', loginForm?: NgForm) {
    if (type === 'google') this.loginWithGoogle();
    if (type === 'email') this.loginWithEmAndPa();
  }
}
