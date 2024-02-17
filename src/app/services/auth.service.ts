import { Injectable, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  RecaptchaVerifier,
  User,
  getAuth,
} from '@angular/fire/auth';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserClass } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnInit {
  usersApiUrl = 'https://us-central1-project0781.cloudfunctions.net/api/';

  defaultClaims: {} = { basic: true, admin: false, superAdmin: false };
  user: any = {};

  isSuperAdmin: BehaviorSubject<boolean> = new BehaviorSubject(false);
  navDisappear: BehaviorSubject<boolean> = new BehaviorSubject(false);

  httpHeaders: HttpHeaders = new HttpHeaders();
  authHeader: any;

  usersSubject!: BehaviorSubject<UserClass[]>;
  userLoggedInSubject: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor(private aFireAuth: AngularFireAuth, private http: HttpClient) {
    this.isLoggedIn().subscribe((user) => {
      if (user) {
        this.user = user;
      }
      user?.getIdToken().then((idToken) => {
        this.user.idToken = idToken;
        this.authHeader = this.httpHeaders.set(
          'Authorization',
          this.user.idToken
        );
        this.getClaims().subscribe((claims) => {
          if (claims) {
            this.user.claims = claims;
            console.log('A felhasználó már rendelkezik jogosultságokkal.');
            this.isSuperAdmin.next(this.user.claims.superAdmin);
            this.userLoggedInSubject.next(this.user);
            console.log(this.userLoggedInSubject)
            this.getUsers().subscribe((users: UserClass[]) => {
              this.usersSubject = new BehaviorSubject(users);
            });
          } else {
            this.setCustomClaims(this.user.uid, this.defaultClaims);
            this.user.claims = this.defaultClaims;
            this.userLoggedInSubject.next(this.user);
            console.log('Alap jogosultságok sikeresen beállítva.');
            this.isSuperAdmin.next(false);
            console.log(this.userLoggedInSubject)
          }
        });
      });
      if (!user) {
        this.user = null;
        console.log('Ön kijelentkezett');
        this.userLoggedInSubject.next(null);
        console.log(this.userLoggedInSubject)
      }
    });
    console.log(this.userLoggedInSubject)
  }

  createUserWithEmAndPa(email: string, password: string) {
    return this.aFireAuth.createUserWithEmailAndPassword(email, password);
  }

  getUserLoggedInSubject() {
    return this.userLoggedInSubject
  }

  getUsersSubject() {
    return this.usersSubject;
  }

  getUser(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.aFireAuth.user.subscribe(
        (user: any) => {
          resolve(user);
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  getClaims() {
    return this.http.get(this.usersApiUrl + `users/${this.user.uid}/claims`, {
      headers: this.authHeader,
    });
  }

  getUsers(): Observable<UserClass[]> {
    if (this.user.idToken) {
      let headers = new HttpHeaders().set('Authorization', this.user.idToken);
      return this.http.get<UserClass[]>(this.usersApiUrl + 'users', {
        headers,
      });
    }
    return of([]);
  }

  isLoggedIn() {
    return this.aFireAuth.authState;
  }

  isLoggedInBoolean() {
    if(this.user.uid) {
      return true
    } else return false
  }

  loginWithEmAndPa(email: string, password: string) {
    this.aFireAuth.signInWithEmailAndPassword(email, password);
  }

  ngOnInit(): void {}

  setCustomClaims(uid: string, claims: any) {
    const body = { uid, claims };
    this.http
      .post(this.usersApiUrl + 'setCustomClaims', body, {
        headers: this.authHeader,
      })
      .subscribe({
        next: () => console.log('A claims beállítása sikeres!'),
      });
  }

  signOut() {
    this.aFireAuth.signOut();
  }

  signInWithGoogle() {
    return this.aFireAuth.signInWithPopup(new GoogleAuthProvider());
  }

  signInWithFacebook() {
    return this.aFireAuth.signInWithPopup(new FacebookAuthProvider());
  }

  signInWithPhoneNumber(phoneNumber: string) {
    return this.aFireAuth.signInWithPhoneNumber(
      phoneNumber,
      new RecaptchaVerifier(getAuth(), 'reCaptchaContainer', {})
    );
  }

  verifyPhoneNumberAndSignIN(credential: any) {
    return this.aFireAuth.signInWithCredential(credential);
  }
}
