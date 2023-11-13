import { Component } from '@angular/core';
import { PhoneAuthProvider } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent{
  email:string = "";
  password:string = "";
  phoneNumber: any;
  verificationCode: any;
  verificationId: any;
  emailOrGoogle: boolean = false;
  facebookOrGoogle: boolean = false;
  isPhone: boolean = false;
  reCapthcaOff: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    ){

  }

  loginWithEmAndPa() {
    this.authService.loginWithEmAndPa(this.email, this.password);
    this.router.navigate(["notes"]);
  }

  loginWithGoogle(): void {
    this.authService.signInWithGoogle().then(
      ()=> this.router.navigate(["notes"])
    );
  }

  loginWithFacebook(): void {
    this.authService.signInWithFacebook().then(
      ()=> this.router.navigate(["notes"])
    );
  }

  booleanFunction() {
    this.emailOrGoogle = !this.emailOrGoogle;
  }

  //new RecaptchaVerifier(getAuth(), 'reCaptchaContainer', {})
  startLoginWithPhoneNumber() {
    this.authService.signInWithPhoneNumber(this.phoneNumber).then(
      (result) => {
        this.verificationId = result.verificationId;
        this.reCapthcaOff = true;
      }
    );
  }

  verifyPhoneNumberAndLogin() {
    const credentials = PhoneAuthProvider.credential(this.verificationId, this.verificationCode)
    this.authService.verifyPhoneNumberAndSignIN(credentials).then(
      ()=> this.router.navigate(["notes"])
    )
  }

}
