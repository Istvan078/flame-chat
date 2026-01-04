import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { UtilityService } from 'src/app/services/utility.service';

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
})
export class BottomNavComponent implements OnInit, OnDestroy {
  userLoggedIn = false;
  userLoggedInSubjSub: Subscription = Subscription.EMPTY;
  constructor(
    private router: Router,
    private base: BaseService,
    private util: UtilityService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.userLoggedInSubjSub = this.auth.userLoggedInSubject.subscribe(usr => {
      this.userLoggedIn = usr.uid ? true : false;
    });
    const int = setInterval(() => {
      if (this.util.userProfile?.key) {
        this.base.isUserOnline(this.util.userProfile?.key, false);
        this.listenMsgDeliveries();
        clearInterval(int);
      }
    }, 200);
  }

  isRouteActive(path: string): boolean {
    return this.router.url.includes(path);
  }

  listenMsgDeliveries() {
    this.base.listenConversation(this.util.userProfile.key);
  }

  ngOnDestroy(): void {
    if (this.userLoggedInSubjSub) this.userLoggedInSubjSub.unsubscribe();
  }
}
