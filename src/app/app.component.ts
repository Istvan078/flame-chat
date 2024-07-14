import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { BaseService } from './services/base.service';
import { Subscription } from 'rxjs';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Flame Chat';
  routerOutletOff: boolean = false;
  routerOutletOffSub!: Subscription;
  onDestroyRef = inject(DestroyRef);

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
      this.swUpdate.checkForUpdate().then(up => console.log(up));
      const swUpdateSub = this.swUpdate.versionUpdates.subscribe(val => {
        console.log(val.type);
        if (val.type === 'NO_NEW_VERSION_DETECTED') swUpdateSub.unsubscribe();
        if (val.type === 'VERSION_READY') {
          swUpdateSub.unsubscribe();
          const result = confirm(
            `Új verzió ${
              (val as VersionReadyEvent).latestVersion.hash
            } elérhető. Betöltsem az új verziót?`
          );
          if (result === true) {
            window.location.reload();
          }
        }
      });
    }
  };

  ngOnDestroy(): void {
    this.routerOutletOffSub.unsubscribe();
  }
}
