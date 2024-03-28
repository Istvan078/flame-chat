import { getLocaleFirstDayOfWeek } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { ModalComponent } from '../modals/modal/modal.component';
import { FirestoreService } from 'src/app/services/firestore.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit, OnDestroy {
  user: UserClass = new UserClass();
  userProfile: UserClass = new UserClass();
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
    private modalRef: NgbModal,
    private fireStoreService: FirestoreService
  ) {}

  ngOnInit(): void {
    this.userLoggedInSubjSub = this.authService.userLoggedInSubject.subscribe(
      (usr) => {
        if (usr.uid || usr.claims.basic) {
          console.log(usr);
          this.user = usr;
          console.log(this.user);
        }
        this.base.getUserProfiles().subscribe((uProfs) => {
          this.userProfile = uProfs.find((uP: any) => uP.uid === this.user.uid);
        });
      }
    );
    this.isSuperAdminSub = this.authService.isSuperAdmin.subscribe(
      (booleanSA) => {
        this.isSuperAdmin = booleanSA;
      }
    );
  }

  signOut() {
    this.authService.authNullSubject.next(null);
    this.isSuperAdmin = false;
      // jelenlegi feliratkozás a push értesítésekre
    const myPushSubscription: PushSubscription = this.authService.swPushh();
      // törölni a firestore-ból a push notifications-t az adott eszközről
        if (myPushSubscription && this.userProfile.displayName) {
          let JSONed = myPushSubscription.toJSON();
          console.log(JSONed);
          console.log(this.userProfile);
          if(this.userProfile)
          this.fireStoreService.deleteUserNotiSubscription(
            this.userProfile['key'],
            JSONed.endpoint!
          ).then((res:any) => {
            this.authService.signOut()
          }).catch((err) => {
            console.log(err)
            this.authService.signOut()
          });     
        } 
     

      if (!myPushSubscription) {this.authService.signOut()}
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
