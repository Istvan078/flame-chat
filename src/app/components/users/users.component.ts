import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserClass, UserInterface } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements AfterViewInit, OnDestroy {
  columns: string[] = [
    'Megjelenítési név',
    'Profilkép',
    'Email-cím',
    'Jogosultságok',
  ];
  subscription!: Subscription;
  users: any;
  @ViewChild('saveChanges', { static: false }) saveChanges!: ElementRef;

  constructor(private authService: AuthService, private router: Router) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.authService.getUsers().subscribe((users: UserClass[]) => {
        this.users = users;
      });
    }, 1000);
  }

  changeClaims(user: any) {
    this.authService.setCustomClaims(user.uid, user.claims);
    setTimeout(() => {
      this.saveChanges.nativeElement.disabled = false;
      this.saveChanges.nativeElement.style.backgroundColor = 'darkgreen';
    }, 3000);
  }

  save() {
    this.authService.navDisappear.next(false);
    this.subscription = this.authService.navDisappear.subscribe(
      (isTrue: boolean) => {}
    );
    this.router.navigate(['home']);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    console.log('sikeres leiratkozas');
  }
}
