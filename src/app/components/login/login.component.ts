import { Component } from '@angular/core';
import { PhoneAuthProvider } from '@angular/fire/auth';
import { Router } from '@angular/router'
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';

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

  constructor(
    private authService: AuthService,
    private router: Router,
    private base: BaseService
  ) {}

  loginWithEmAndPa() {
    this.authService.loginWithEmAndPa(this.email, this.password);
    this.authService.isLoggedIn().subscribe((user: any) => {
      this.base.getUserProfiles().subscribe((userProfiles: any) => {
        this.userProfiles = userProfiles;

        let userProfile = this.userProfiles.filter(
          (userProfile: any) => userProfile.uid === user.uid
        );
        console.log(userProfile);

        this.base.userProfileSubject.next(userProfile);

        if (userProfile.length === 0) {
          userProfile.push(user);
          for (let i = 0; i < 1; i++) {
            this.base.addUserData({
              uid: userProfile[0].uid,
              email: user.email,
            });
            console.log('ciklus lefutott');
          }
        } else {
          console.log('van már ilyen user');
        }
        if (userProfile.length != 0) {
          console.log('siker', userProfile.length);
        }
        if (
          userProfile[0].birthDate === undefined ||
          userProfile[0].birthDate === ''
        ) {
          this.router.navigate(['profile/' + user.uid]);
        } else {
          this.router.navigate(['profile/' + user.uid]);
        }
      });
    });
  }

  loginWithGoogle(): void {
    this.authService.signInWithGoogle().then(() => {
      this.authService.isLoggedIn().subscribe((user: any) => {
        this.base.getUserProfiles().subscribe((userProfiles: any) => {
          this.userProfiles = userProfiles;

          let userProfile = this.userProfiles.filter(
            (userProfile: any) => userProfile.uid === user.uid
          );
          console.log(userProfile);

          if (userProfile.length === 0) {
            userProfile.push(user);
            for (let i = 0; i < 1; i++) {
              this.base.addUserData({
                uid: userProfile[0].uid,
                email: user.email,
              });
              console.log('felhasználó hozzáadva');
            }
          } else {
            console.log('van már ilyen user');
          }
          if (
            userProfile[0].birthDate === undefined ||
            userProfile[0].birthDate === ''
          ) {
            this.router.navigate(['profile/' + user.uid]);
          } else {
            this.router.navigate(['']);
          }
        });

        //   }
        // )
        //   }
        // )
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

  //new RecaptchaVerifier(getAuth(), 'reCaptchaContainer', {})
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
     this.authService
      .verifyPhoneNumberAndSignIN(credentials)
      .then(() => {
        this.authService.isLoggedIn().subscribe(
          (user: any) => {
            this.base.getUserProfiles().subscribe(
              (userProfiles: any[]) =>  {let userProfile = userProfiles.filter(
                (userProfile: UserClass) => userProfile.uid === user.uid
              )
              if((userProfile.length === 0)) {
                userProfile.push(user)
                this.base.addUserData({
                  uid: user.uid,
                  phoneNumber: user.phoneNumber
                }) 
                
                
              }
              if(userProfile[0]['birthDate'] === undefined ||
                userProfile[0]['birthDate'] === '') {
 
                this.router.navigate(['profile/' + user.uid ])
                
              } else  {
                this.router.navigate([''])
              }
            }
            )
            

          }
        )
        
      });
  }
}
