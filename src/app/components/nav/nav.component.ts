import { getLocaleFirstDayOfWeek } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { ModalComponent } from '../modals/modal/modal.component';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit, OnDestroy {
  user: UserClass = new UserClass();
  isSuperAdmin: boolean = false;
  isNavDisappeared: boolean = false;
  isMenuClicked: boolean = false;
  sideNavToggle: boolean = false;
  allNotifications: number = 0;
  isSuperAdminSub!: Subscription;
  userLoggedInSubjSub!: Subscription;

  compOfNoti!: boolean;

  constructor(
    private authService: AuthService,
    private base: BaseService,
    private modalRef: NgbModal
  ) {}

  ngOnInit(): void {

    this.userLoggedInSubjSub = this.authService.userLoggedInSubject.subscribe(
      (usr) => {
        if (usr.uid || usr.claims.basic) {
          console.log(usr);
          this.user = usr;
          console.log(this.user);
        }
      }
    );
    this.isSuperAdminSub = this.authService.isSuperAdmin.subscribe(
      (booleanSA) => {
        this.isSuperAdmin = booleanSA;
      }
    );
  }

  signOut() {
    this.authService.signOut();
    this.authService.authNullSubject.next(null);
    this.isSuperAdmin = false;
  }

  rOutletOn() {
    this.sideNavToggle = !this.sideNavToggle;
  }

  navDisappear() {
    this.authService.navDisappear.next(true);
    this.authService.navDisappear.subscribe((isTrue: boolean) => {
      this.isNavDisappeared = isTrue;
    });
  }
  ngOnDestroy(): void {
    this.userLoggedInSubjSub.unsubscribe();
    this.isSuperAdminSub.unsubscribe();
    this.authService.navDisappear.unsubscribe();
    console.log('sikeres leiratkozas');
  }
}
