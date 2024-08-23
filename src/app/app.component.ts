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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Flame Chat';
  routerOutletOff: boolean = false;
  routerOutletOffSub!: Subscription;
  private matDialog = inject(MatDialog);
  private onDestroyRef = inject(DestroyRef);

  constructor(private base: BaseService, private swUpdate: SwUpdate) {}
  ngOnInit(): void {
    const interval = setInterval(this.checkForVersionUpdate, 30000);
    this.routerOutletOffSub = this.base.logicalSubject.subscribe(
      logic => (this.routerOutletOff = logic)
    );
    this.onDestroyRef.onDestroy(() => {
      clearInterval(interval);
    });
  }

  checkForVersionUpdate = () => {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate().then(isUpd => isUpd);
      const swUpdateSub = this.swUpdate.versionUpdates.subscribe(val => {
        if (val.type === 'NO_NEW_VERSION_DETECTED') swUpdateSub.unsubscribe();
        if (val.type === 'VERSION_READY') {
          swUpdateSub.unsubscribe();
          const matDialogRef = this.matDialog.open(MatModalComponent, {
            enterAnimationDuration: 2000,
          });
          matDialogRef.componentInstance.isUpdateForApp = true;
          matDialogRef.afterClosed().subscribe(res => {
            if (res === true) window.location.reload();
          });
        }
      });
    }
  };

  ngOnDestroy(): void {
    this.routerOutletOffSub.unsubscribe();
  }
}
