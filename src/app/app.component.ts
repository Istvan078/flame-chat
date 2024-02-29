import { Component, OnDestroy, OnInit } from '@angular/core';
import { BaseService } from './services/base.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy{
  title = 'Project';
  routerOutletOff: boolean = false
  routerOutletOffSub!: Subscription

  constructor(private base: BaseService) {}
  ngOnInit(): void {
    this.routerOutletOffSub = this.base.logicalSubject.subscribe(
      (logic) => this.routerOutletOff = logic
    )
  }

  ngOnDestroy(): void {
    this.routerOutletOffSub.unsubscribe()
  }
}
