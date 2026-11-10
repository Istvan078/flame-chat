import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { UserClass } from 'src/app/features/people/user.model';
import { Environments } from 'src/app/environments';

@Injectable({
  providedIn: 'root',
})
export class SessionStateService {
  usersApiUrl = Environments.API_URL;

  user: UserClass = new UserClass();

  httpHeaders: HttpHeaders = new HttpHeaders();
}
