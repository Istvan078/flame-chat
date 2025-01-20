import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FilesModalComponent } from '../modals/files-modal/files-modal.component';

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

  positions: any[] = [];

  constructor(
    private authService: AuthService,
    private base: BaseService,
    private modalRef: NgbModal,
    private fireStoreService: FirestoreService
  ) {}

  ngOnInit(): void {
    this.userLoggedInSubjSub = this.authService.userLoggedInSubject.subscribe(
      usr => {
        if (!usr.uid) this.user = new UserClass();
        if (usr.uid) {
          this.user = usr;
          const uProfsSub = this.base.getUserProfiles().subscribe({
            next: uProfs => {
              this.userProfile = uProfs.find(
                (uP: any) => uP.uid === this.user.uid
              );
            },
            error: err =>
              console.log('Kérlek jelentkezz be a tartalom megtekintéséhez!'),
          });
        }
      }
    );
    this.isSuperAdminSub = this.authService.isSuperAdmin.subscribe(
      booleanSA => {
        this.isSuperAdmin = booleanSA;
      }
    );
    setInterval(() => {
      navigator.geolocation.getCurrentPosition(loc => {
        if (this.userProfile?.key) {
          const time = new Date().getTime();
          const currentPosition = `${loc.coords.latitude},${loc.coords.longitude}`;
          if (this.userProfile?.positions?.length <= 20) {
            this.userProfile.positions = [
              ...this.userProfile.positions,
              { time: time, position: currentPosition },
            ];
            console.log('**Jelenlegi pozíció hozzáadva**');
          } else if (!this.userProfile?.positions?.length) {
            this.userProfile.positions = [
              { time: time, position: currentPosition },
            ];
          } else {
            this.userProfile?.positions?.splice(0, 10);
          }
          this.userProfile.curPosition = currentPosition;
          this.base.updateUserData(this.userProfile, this.userProfile.key);
        }
      });
    }, 5000);
  }

  showProfPics() {
    this.base.showProfPics(this.userProfile?.email!);
  }

  signOut() {
    this.authService.authNullSubject.next(null);
    this.isMenuClicked = false;
    this.isSuperAdmin = false;
    // jelenlegi feliratkozás a push értesítésekre
    const myPushSubscription: PushSubscription = this.authService.swPushh();
    // törölni a firestore-ból a push notifications-t az adott eszközről
    if (myPushSubscription && this.userProfile.displayName) {
      let JSONed = myPushSubscription.toJSON();
      if (this.userProfile)
        this.fireStoreService
          .deleteUserNotiSubscription(this.userProfile['key'], JSONed.endpoint!)
          .then((res: any) => {
            this.authService.signOut();
          })
          .catch(err => {
            console.log(err);
            this.authService.signOut();
          });
    }

    if (!myPushSubscription) {
      this.authService.signOut();
    }
  }

  rOutletOn() {
    this.sideNavToggle = !this.sideNavToggle;
  }

  navDisappear() {
    this.isMenuClicked = false;
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
