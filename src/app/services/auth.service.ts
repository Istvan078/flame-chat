import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  RecaptchaVerifier,
  getAuth,
} from '@angular/fire/auth';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserClass } from '../models/user.model';
import { SwPush } from '@angular/service-worker';
import { FirestoreService } from './firestore.service';

// import  {NotificationsScript}  from '../utils/notifications';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  usersApiUrl = 'https://us-central1-project0781.cloudfunctions.net/api/';

  defaultClaims: {} = { basic: true, admin: false, superAdmin: false };
  user: UserClass = new UserClass();

  notiSub: any;

  isSuperAdmin: BehaviorSubject<boolean> = new BehaviorSubject(false);
  navDisappear: BehaviorSubject<boolean> = new BehaviorSubject(false);
  userClaimsSubj: BehaviorSubject<{}> = new BehaviorSubject({});

  readonly VAPID_PUBLIC_KEY =
    'BNDP_ZCBO61xD-DAXQiGkshAMJdemtl0-jSsRl6amjuD3RD--YFRMK-yt9ZTN92I8kbRI8krLihrFSXDs8QMM0k';

  httpHeaders: HttpHeaders = new HttpHeaders();
  authHeader: any;

  authNullSubject: BehaviorSubject<any> = new BehaviorSubject(2);

  usersSubject: BehaviorSubject<any> = new BehaviorSubject([]);
  userLoggedInSubject: BehaviorSubject<any> = new BehaviorSubject(
    new UserClass()
  );

  constructor(
    private aFireAuth: AngularFireAuth,
    private http: HttpClient,
    private swPush: SwPush,
    private fStoreServ: FirestoreService
  ) {
    this.isLoggedIn().subscribe((user: any) => {
      if (user) {
        this.user = user;
        this.getIdToken(user);
      }
      if (!user) {
        this.user = new UserClass();
        console.log('Ön kijelentkezett');
        this.userLoggedInSubject.next(new UserClass());
      }
    });
    this.subscribeToNotifications();
    this.swPush.messages.subscribe((val) => console.log(val));

    this.swPush.notificationClicks.subscribe((event) =>
      console.log('rákattoltál a gombra', event)
    );
  }

  swPushh() {
    return this.notiSub;
  }

  subscribeToNotifications() {
    if(this.swPush.isEnabled) {
      this.swPush
      .requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY,
      })
      .then((sub) => {
        this.notiSub = sub;
        localStorage.setItem('notificationSubscription', this.notiSub);
      })
      .catch((err) =>
        console.error('Could not subscribe to notifications', err)
      );
    }

  }

  getIdToken(user: any) {
    user?.getIdToken().then((idToken: string) => {
      this.user.idToken = idToken;
      this.httpHeaders = this.httpHeaders.set(
        'Authorization',
        this.user.idToken
      );
      this.getClaims().subscribe((claims: any) => {
        if (claims) {
          this.user.claims = claims;
          this.userLoggedInSubject.next(this.user);
          this.isSuperAdmin.next(this.user.claims?.superAdmin);
          this.userClaimsSubj.next(claims);

          this.getUsers().subscribe((users: any) => {
            this.usersSubject.next(users);
          });
        } else {
          if (this.user.uid) {
            this.setCustomClaims(this.user.uid, this.defaultClaims);
            this.userLoggedInSubject.next(this.user);
            this.isSuperAdmin.next(false);
          }
        }
      });
    });
  }

  createUserWithEmAndPa(email: string, password: string) {
    return this.aFireAuth.createUserWithEmailAndPassword(email, password);
  }

  getUserLoggedInSubject() {
    return this.userLoggedInSubject;
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
      headers: this.httpHeaders,
    });
  }

  getUsers(): Observable<UserClass[]> {
    if (this.user.idToken) {
      // let headers = new HttpHeaders().set('Authorization', this.user.idToken);
      return this.http.get<UserClass[]>(this.usersApiUrl + 'users', {
        headers: this.httpHeaders,
      });
    }
    return of([]);
  }

  isLoggedIn() {
    return this.aFireAuth.authState;
  }

  isLoggedInBoolean() {
    if (this.user.uid) {
      return true;
    } else return false;
  }

  loginWithEmAndPa(email: string, password: string) {
    this.aFireAuth.signInWithEmailAndPassword(email, password);
  }

  setCustomClaims(uid: string, claims: any) {
    const body = { uid, claims };
    this.http
      .post(this.usersApiUrl + 'setCustomClaims', body, {
        headers: this.httpHeaders,
      })
      .subscribe({
        next: () => console.log('A claims beállítása sikeres!'),
      });
  }

  signOut() {
    return this.aFireAuth.signOut();
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
