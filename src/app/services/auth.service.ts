import { Injectable } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { FacebookAuthProvider, GoogleAuthProvider, RecaptchaVerifier, getAuth } from "@angular/fire/auth";
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private aFireAuth: AngularFireAuth
  ) { }

    createUserWithEmAndPa(email:string, password:string) {
      this.aFireAuth.createUserWithEmailAndPassword(email, password)
    }

    isLoggedIn(){
    return this.aFireAuth.authState
    }

    loginWithEmAndPa(email:string, password:string) {
    this.aFireAuth.signInWithEmailAndPassword(email, password)
    }


    signOut() {
      this.aFireAuth.signOut();
    }

    signInWithGoogle() {
    return  this.aFireAuth.signInWithPopup(new GoogleAuthProvider());
    }

    signInWithFacebook() {
    return this.aFireAuth.signInWithPopup(new FacebookAuthProvider());
    }

    signInWithPhoneNumber(phoneNumber: string) {
      return this.aFireAuth.signInWithPhoneNumber(phoneNumber, new RecaptchaVerifier(getAuth(), 'reCaptchaContainer', {}))
    }

    verifyPhoneNumberAndSignIN(credential:any) {
      
    return  this.aFireAuth.signInWithCredential(credential)
    }

}
