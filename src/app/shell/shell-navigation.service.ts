import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShellNavigationService {
  navDisappear: BehaviorSubject<boolean> = new BehaviorSubject(false);
}
