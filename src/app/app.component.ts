import { Component, OnDestroy, OnInit } from '@angular/core';
import { BaseService } from './services/base.service';
import { Subscription } from 'rxjs';
import { SwPush, SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Flame Chat';
  routerOutletOff: boolean = false;
  routerOutletOffSub!: Subscription;

  apiUrl = 'https://us-central1-project0781.cloudfunctions.net/api/';
  
  readonly VAPID_PUBLIC_KEY = "BNDP_ZCBO61xD-DAXQiGkshAMJdemtl0-jSsRl6amjuD3RD--YFRMK-yt9ZTN92I8kbRI8krLihrFSXDs8QMM0k"
  readonly PRIVATE_KEY = "1JBEK1YxrcorQiiqXaCznATmfHCmt9sET_s3XMbKpoI"
  msg: any = {
    displayName: 'Istvan',
    message: 'Hello',
    profilePhoto: 'https://firebasestorage.googleapis.com/v0/b/project0781.appspot.com/o/profilePictures%2FIMG_20210322_110404.jpg?alt=media&token=bd3a690e-53b6-4a6e-8aef-ba7e142b2171',
    timeStamp: '123253252353654'
  }
  sub: any;

  constructor(private base: BaseService, private swUpdate: SwUpdate,
    private swPush: SwPush,
    private aFireMessaging: AngularFireMessaging) {}
  ngOnInit(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((val) => {
        console.log(val.type);
        if (val.type === 'VERSION_READY') {
          
          const result = confirm(
            `Új verzió ${(val as VersionReadyEvent).latestVersion.hash} elérhető. Betöltsem az új verziót?`
          );
          if (result === true) {
            window.location.reload();
          } else return;
        }
      });
    }
    this.routerOutletOffSub = this.base.logicalSubject.subscribe(
      (logic) => (this.routerOutletOff = logic)
    );
  }

  ngOnDestroy(): void {
    this.routerOutletOffSub.unsubscribe();
  }
}
