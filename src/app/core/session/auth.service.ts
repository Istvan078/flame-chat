import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  RecaptchaVerifier,
  getAuth,
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserClass } from 'src/app/features/people/user.model';
import { Router } from '@angular/router';
import { AdminUsersService } from 'src/app/features/admin/admin-users.service';
import { PushNotificationsService } from 'src/app/features/notifications/push-notifications.service';
import { SessionStateService } from './session-state.service';

// import  {NotificationsScript}  from '../utils/notifications';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  defaultClaims: {} = { basic: true, admin: false, superAdmin: false };

  isSuperAdmin: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private isAdmin: BehaviorSubject<boolean> = new BehaviorSubject(false);
  userClaimsSubj: BehaviorSubject<{}> = new BehaviorSubject({});
  authHeader: any;

  authNullSubject: BehaviorSubject<any> = new BehaviorSubject(2);
  userLoggedInSubject: BehaviorSubject<any> = new BehaviorSubject(
    new UserClass(),
  );
  isUserReadySubj: BehaviorSubject<boolean> = new BehaviorSubject(false);

  get usersApiUrl(): string {
    return this.sessionState.usersApiUrl;
  }

  set usersApiUrl(value: string) {
    this.sessionState.usersApiUrl = value;
  }

  get user(): UserClass {
    return this.sessionState.user;
  }

  set user(value: UserClass) {
    this.sessionState.user = value;
  }

  get httpHeaders(): HttpHeaders {
    return this.sessionState.httpHeaders;
  }

  set httpHeaders(value: HttpHeaders) {
    this.sessionState.httpHeaders = value;
  }

  constructor(
    private aFireAuth: AngularFireAuth,
    private http: HttpClient,
    private fStoreServ: PushNotificationsService,
    private router: Router,
    private sessionState: SessionStateService,
    private adminUsers: AdminUsersService,
  ) {
    this.isLoggedIn().subscribe((user: any) => {
      if (user) {
        this.user = user;
        this.getIdToken(user);
        this.userLoggedInSubject.next(this.user);
        this.isUserReadySubj.next(true);
      }
      if (!user) {
        this.user = new UserClass();
        this.userLoggedInSubject.next(new UserClass());
        this.isUserReadySubj.next(true);
      }
    });
    this.fStoreServ.subscribeToNotifications();
  }

  getIdToken(user: any) {
    user?.getIdToken().then((idToken: string) => {
      this.user.idToken = idToken;
      this.httpHeaders = this.httpHeaders.set(
        'Authorization',
        this.user.idToken,
      );
      this.getClaims().subscribe((claims: any) => {
        if (claims) {
          this.user.claims = claims;
          this.isSuperAdmin.next(this.user.claims?.superAdmin);
          this.isAdmin.next(this.user.claims?.admin);
          this.userClaimsSubj.next(claims);
          this.adminUsers.getUsers().subscribe((users: any) => {
            this.adminUsers.usersSubject.next(users);
          });
        } else {
          if (this.user.uid) {
            this.adminUsers.setCustomClaims(this.user.uid, this.defaultClaims);
            this.userLoggedInSubject.next(this.user);
            this.isAdmin.next(false);
            this.isSuperAdmin.next(false);
          }
        }
      });
    });
  }

  getIsAdminSubj() {
    return new Observable<boolean>(obs => {
      const int = setInterval(() => {
        if (this.isAdmin.value === true) {
          obs.next(this.isAdmin.value);
          clearInterval(int);
        }
      }, 20);
      setTimeout(() => {
        if (this.isAdmin.value === false) clearInterval(int);
        obs.next(false);
      }, 1000);
    });
  }

  myCustomObservable(options: {
    successCondition: any;
    failureCondition: any;
    nextData: any;
    failureData: any;
    intervalCheckTime: number;
    failureTimeOut: number;
  }) {
    return new Observable(obs => {
      const interval = setInterval(() => {
        if (options.successCondition) {
          console.log(options.nextData);
          clearInterval(interval);
          obs.next(options.nextData);
        }
      }, options.intervalCheckTime);
      setTimeout(() => {
        if (options.failureCondition) {
          console.log(options.failureData);
          clearInterval(interval);
          obs.next(options.failureData);
        }
      }, options.failureTimeOut);
    });
  }

  createUserWithEmAndPa(email: string, password: string) {
    return this.aFireAuth.createUserWithEmailAndPassword(email, password);
  }

  getUserLoggedInSubject() {
    return this.userLoggedInSubject;
  }

  getUser(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.aFireAuth.user.subscribe(
        (user: any) => {
          resolve(user);
        },
        (error: any) => {
          reject(error);
        },
      );
    });
  }

  getClaims() {
    return this.http.get(this.usersApiUrl + `users/${this.user.uid}/claims`, {
      headers: this.httpHeaders,
    });
  }

  isLoggedIn() {
    return this.aFireAuth.authState;
  }

  loginWithEmAndPa(email: string, password: string) {
    return this.aFireAuth.signInWithEmailAndPassword(email, password);
  }

  async signOut() {
    this.isUserReadySubj.next(false);
    await this.aFireAuth.signOut();
    this.router.navigate(['/login']);
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
      new RecaptchaVerifier(getAuth(), 'reCaptchaContainer', {}),
    );
  }

  verifyPhoneNumberAndSignIN(credential: any) {
    return this.aFireAuth.signInWithCredential(credential);
  }
}
