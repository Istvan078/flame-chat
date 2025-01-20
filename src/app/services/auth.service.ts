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
import { FirebaseUser, UserClass } from '../models/user.model';
import { SwPush } from '@angular/service-worker';
import { FirestoreService } from './firestore.service';
import { Router } from '@angular/router';
import { Environments } from '../environments';

// import  {NotificationsScript}  from '../utils/notifications';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  usersApiUrl = Environments.API_URL;

  defaultClaims: {} = { basic: true, admin: false, superAdmin: false };
  user: UserClass = new UserClass();

  notiSub: any;

  isSuperAdmin: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private isAdmin: BehaviorSubject<boolean> = new BehaviorSubject(false);
  navDisappear: BehaviorSubject<boolean> = new BehaviorSubject(false);
  userClaimsSubj: BehaviorSubject<{}> = new BehaviorSubject({});

  readonly VAPID_PUBLIC_KEY = Environments.VAPID_PUBLIC_KEY;

  httpHeaders: HttpHeaders = new HttpHeaders();
  authHeader: any;

  authNullSubject: BehaviorSubject<any> = new BehaviorSubject(2);

  usersSubject: BehaviorSubject<any> = new BehaviorSubject([]);
  userLoggedInSubject: BehaviorSubject<any> = new BehaviorSubject(
    new UserClass()
  );
  // isLoggedInSub!: Subscription;

  constructor(
    private aFireAuth: AngularFireAuth,
    private http: HttpClient,
    public swPush: SwPush,
    private fStoreServ: FirestoreService,
    private router: Router
  ) {
    this.isLoggedIn().subscribe((user: any) => {
      if (user) {
        this.user = user;
        this.getIdToken(user);
        this.userLoggedInSubject.next(this.user);
      }
      if (!user) {
        this.user = new UserClass();
        // this.isLoggedInSub.unsubscribe();
        this.userLoggedInSubject.next(new UserClass());
        this.router.navigate(['/home']);
      }
    });
    this.subscribeToNotifications();
  }

  swPushh() {
    return this.notiSub;
  }

  async subscribeToNotifications() {
    if (this.swPush.isEnabled) {
      try {
        const myPushSub = await this.swPush.requestSubscription({
          serverPublicKey: this.VAPID_PUBLIC_KEY,
        });
        this.notiSub = myPushSub;
        // console.log('SIKERES FELIRATKOZÁS AZ ÉRTESÍTÉSEKRE');
      } catch (err) {
        // console.error('NEM TUDTAM FELIRATKOZNI AZ ÉRTESÍTÉSEKRE', err);
      }
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
          // this.userLoggedInSubject.next(this.user);
          // this.isLoggedInSub = this.myCustomObservable({
          //   successCondition: this.user.uid,
          //   failureCondition: !this.user.uid,
          //   failureData: this.user,
          //   nextData: this.user,
          //   failureTimeOut: 5000,
          //   intervalCheckTime: 200,
          // }).subscribe();
          this.isSuperAdmin.next(this.user.claims?.superAdmin);
          this.isAdmin.next(this.user.claims?.admin);
          this.userClaimsSubj.next(claims);
          this.getUsers().subscribe((users: any) => {
            this.usersSubject.next(users);
          });
        } else {
          if (this.user.uid) {
            this.setCustomClaims(this.user.uid, this.defaultClaims);
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

  getUsers(): Observable<FirebaseUser[]> {
    if (this.user.idToken) {
      // let headers = new HttpHeaders().set('Authorization', this.user.idToken);
      return this.http.get<FirebaseUser[]>(this.usersApiUrl + 'users', {
        headers: this.httpHeaders,
      });
    }
    return of([]);
  }

  isLoggedIn() {
    return this.aFireAuth.authState;
  }

  loginWithEmAndPa(email: string, password: string) {
    return this.aFireAuth.signInWithEmailAndPassword(email, password);
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
