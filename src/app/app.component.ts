import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { BaseService } from './services/base.service';
import { Subscription } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';
import { MatDialog } from '@angular/material/dialog';
import { MatModalComponent } from './components/modals/mat-modal/mat-modal.component';
import { UtilityService } from './services/utility.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Flame Chat';
  routerOutletOff: boolean = false;
  routerOutletOffSub!: Subscription;
  chosenMsgThemeSub: Subscription = Subscription.EMPTY;
  chosenMsgTheme: any;
  private matDialog = inject(MatDialog);
  private onDestroyRef = inject(DestroyRef);
  private base = inject(BaseService);
  private utilService = inject(UtilityService);

  constructor(private swUpdate: SwUpdate) {}
  ngOnInit(): void {
    const interval = setInterval(this.checkForVersionUpdate, 30000);
    this.routerOutletOffSub = this.base.logicalSubject.subscribe(
      logic => (this.routerOutletOff = logic)
    );
    this.onDestroyRef.onDestroy(() => {
      clearInterval(interval);
      this.chosenMsgThemeSub.unsubscribe();
    });
    this.chosenMsgThemeSub = this.base.chosenMsgThemeSubject.subscribe(
      (chmsgth: any) => {
        this.chosenMsgTheme = chmsgth;
      }
    );
  }

  checkForVersionUpdate = () => {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate().then(isUpd => isUpd);
      const swUpdateSub = this.swUpdate.versionUpdates.subscribe(async val => {
        if (val.type === 'NO_NEW_VERSION_DETECTED') swUpdateSub.unsubscribe();
        if (val.type === 'VERSION_READY') {
          swUpdateSub.unsubscribe();
          // const matDialogRef = this.matDialog.open(MatModalComponent, {
          //   enterAnimationDuration: 2000,
          // });
          // matDialogRef.componentInstance.isUpdateForApp = true;
          // matDialogRef.afterClosed().subscribe(res => {
          //   window.location.reload();
          // });
          const profsSub = this.base
            .getUserProfiles()
            .subscribe(async uProfs => {
              const uProf = uProfs.find(
                (uP: any) =>
                  uP.uid === this.utilService.forUserSubject.userProfile.uid
              );
              uProf.appVersion = '1.1.5';
              console.log(``);
              await this.base.updateUserData(uProf, uProf.key);
              profsSub.unsubscribe();
            });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      });
    }
  };

  ngOnDestroy(): void {
    this.routerOutletOffSub.unsubscribe();
  }
}
