import { PeopleService } from 'src/app/features/people/people.service';
import { EmailService } from 'src/app/features/notifications/email.service';
import { inject, Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/core/session/auth.service';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { UserClass } from 'src/app/features/people/user.model';
import { SharedModule } from '../../../shared/shared.module';
import { IonicModule } from '../../../shared/ionic.module';
import { TranslateService } from '@ngx-translate/core';
import { SelectCustomEvent, IonCardHeader } from '@ionic/angular';
import type firebase from 'firebase/compat/app';
import { map, take, tap } from 'rxjs';

@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  imports: [SharedModule, IonicModule, IonCardHeader],
})
export class SignupComponent implements OnInit {
  private emailService = inject(EmailService);

  @ViewChild('f') signupForm!: NgForm;
  email: string = '';
  password: string = '';
  isLoggedIn: any;
  userProfiles: any;
  genderr: any;
  user: any;
  lang: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private base: PeopleService,
    private modalRef: NgbModal,
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

  // Register user with email
  async signupWithEmail(user: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<firebase.auth.UserCredential> {
    const userCreds = await this.authService.createUserWithEmAndPa(
      user.email,
      user.password,
    );
    return userCreds;
  }

  // Signup user with email, google, or phone
  async onSignup(type: 'email' | 'google' | 'phone', signupForm?: NgForm) {
    let userCreds: firebase.auth.UserCredential | undefined = undefined;
    try {
      if (type === 'email' && signupForm?.valid)
        userCreds = await this.signupWithEmail(signupForm?.value);
      if (type === 'google') {
        userCreds = await this.authService.signInWithGoogle();
        this.base
          .getUserProfiles()
          .pipe(
            map((profs: UserClass[]) => {
              console.log(profs);
              const prof = profs.find(
                (prof: UserClass) => prof.uid === userCreds?.user?.uid,
              );
              return prof;
            }),
            take(1),
          )
          .subscribe(prof => {
            if (!prof?.uid)
              this.base.addUserData({
                uid: fbUser?.uid,
                email: fbUser?.email,
                displayName: fbUser?.displayName,
              });
            if (!prof?.birthDate) {
              this.router.navigate(['/profile/' + prof?.uid]);
            } else {
              this.router.navigate(['/chat']);
            }
          });
      }

      const fbUser = userCreds?.user;
      if (type === 'email') {
        await fbUser?.sendEmailVerification();
        this.emailService.sendWelcomeEmail(fbUser?.email!);
        this.base.addUserData({
          uid: fbUser?.uid,
          email: fbUser?.email,
          displayName: signupForm?.value.displayName,
        });
        const actModal = this.modalRef.open(ModalComponent, {
          centered: true,
        });
        actModal.componentInstance.userEmail = fbUser?.email;
        await this.authService.signOut();
        this.authService.userLoggedInSubject.next(new UserClass());
        return this.router.navigate(['/login']);
      }
    } catch (err: any) {
      console.log(err.message);
    }
  }
}
