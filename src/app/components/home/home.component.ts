import {
  AnimationEvent,
  animate,
  group,
  keyframes,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Component } from '@angular/core';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, interval } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('toast') toast: any;
  userLoggedIn: any = {};
  userLoggedInSub!: Subscription;

  constructor(private ngbTConfig: NgbTooltipConfig, private auth: AuthService) {
    ngbTConfig.placement = 'bottom';
    ngbTConfig.tooltipClass = 'tooltippp';
    ngbTConfig.animation = true;
    ngbTConfig.closeDelay = 2000;
  }

  ngOnInit(): void {
    this.userLoggedInSub = this.auth.isLoggedIn().subscribe((user: any) => {
      this.userLoggedIn = {};
      this.userLoggedIn = user;
      if (this.userLoggedIn?.uid && user) {
        this.toastStyler('add');
      }
      if (!user) {
        this.toastStyler('remove');
      }
    });
  }

  toastStyler(removeOrAdd: string) {
    const interval = setInterval(() => {
      const strong = document.querySelector('.me-auto');
      const toastHeader = document.querySelector('.toast-header');
      if (removeOrAdd === 'add') {
        strong?.classList.add('toast-strong');
        toastHeader?.classList.add('toast-header-manual');
        if (strong !== null && toastHeader !== null) clearInterval(interval);
      }
      if (removeOrAdd === 'remove') {
        strong?.classList.remove('toast-strong');
        toastHeader?.classList.remove('toast-header-manual');
        if (strong === null && toastHeader === null) clearInterval(interval);
      }
    }, 200);
  }

  ngOnDestroy(): void {
    this.userLoggedIn = {};
    if (this.userLoggedInSub) {
      this.userLoggedInSub.unsubscribe();
    }
    const strong = document.querySelector('.me-auto');
    strong?.classList.remove('toast-strong');
    const toastHeader = document.querySelector('.toast-header');
    toastHeader?.classList.remove('toast-header-manual');
  }
}
