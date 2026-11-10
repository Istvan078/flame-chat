import { PeopleService } from 'src/app/features/people/people.service';
import { MessagesService } from 'src/app/features/messaging/messages.service';
import { inject, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/session/auth.service';
import { UtilityService } from 'src/app/services/utility.service';

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  standalone: false,
})
export class BottomNavComponent implements OnInit, OnDestroy {
  private messagesService = inject(MessagesService);

  userLoggedIn = false;
  userLoggedInSubjSub: Subscription = Subscription.EMPTY;
  constructor(
    private router: Router,
    private base: PeopleService,
    private util: UtilityService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.userLoggedInSubjSub = this.auth.userLoggedInSubject.subscribe(usr => {
      console.log('Bottom nav user:', usr);
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
    this.messagesService.listenConversation(this.util.userProfile.key);
  }

  ngOnDestroy(): void {
    if (this.userLoggedInSubjSub) this.userLoggedInSubjSub.unsubscribe();
  }
}
