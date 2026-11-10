import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { SessionStateService } from 'src/app/core/session/session-state.service';
import { FirebaseUser } from 'src/app/core/session/firebase-user.model';
import { UserClass } from 'src/app/features/people/user.model';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  usersSubject: BehaviorSubject<any> = new BehaviorSubject([]);

  constructor(
    private http: HttpClient,
    private sessionState: SessionStateService,
  ) {}

  private get usersApiUrl(): string {
    return this.sessionState.usersApiUrl;
  }

  private get user(): UserClass {
    return this.sessionState.user;
  }

  private get httpHeaders(): HttpHeaders {
    return this.sessionState.httpHeaders;
  }

  getUsersSubject() {
    return this.usersSubject;
  }

  getUsers(): Observable<FirebaseUser[]> {
    if (this.user.idToken) {
      return this.http.get<FirebaseUser[]>(this.usersApiUrl + 'users', {
        headers: this.httpHeaders,
      });
    }
    return of([]);
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
}
