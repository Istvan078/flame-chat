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
import { OnInit, ViewEncapsulation } from '@angular/core';
import { Component } from '@angular/core';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';
// import  notifications  from '../../utils/notifications';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('divState', [
      state(
        'normal',
        style({
          backgroundColor: 'red',
          transform: 'translateX(0)',
        })
      ),
      state(
        'highlighted',
        style({
          backgroundColor: 'blue',
          transform: 'translateX(100px)',
        })
      ),
      // from normal to highlighted és vissza
      transition('normal <=> highlighted', animate(1000)),
      // transition('highlighted => normal', animate(1000))
    ]),
    trigger('wildState', [
      state(
        'normal',
        style({
          backgroundColor: 'red',
          transform: 'translateX(0) scale(1)',
        })
      ),
      state(
        'highlighted',
        style({
          backgroundColor: 'blue',
          transform: 'translateX(100px) scale(1)',
        })
      ),
      state(
        'shrunken',
        style({
          backgroundColor: 'green',
          transform: 'translateX(0) scale(0.5)',
        })
      ),
      // from normal to highlighted és vissza
      transition('normal => highlighted', animate(1000)),
      transition('highlighted => normal', animate(2000)),
      // wilcard itt azt jelenti: bármelyik állapot.
      // shrunken to any state and from any state
      transition('shrunken <=> *', [
        style({
          backgroundColor: 'orange',
        }),
        animate(
          1500,
          style({
            borderRadius: '50px',
          })
        ),
        animate(1500),
      ]),
    ]),
    trigger('list1', [
      state(
        'in',
        style({
          opacity: 1,
          transform: 'translateX(0)',
        })
      ),
      // from normal to highlighted és vissza
      // void: elem, ami még nem volt benne a domban kezdetben, angular beépített szava
      transition('void => in', [
        style({
          opacity: 0,
          transform: 'translateX(-100px)',
        }),
        animate(3000),
      ]),
      transition('* => void', [
        animate(
          1000,
          style({
            transform: 'translateX(100px)',
            opacity: 0,
          })
        ),
      ]),
    ]),
    trigger('list2', [
      state(
        'in',
        style({
          opacity: 1,
          transform: 'translateX(0)',
        })
      ),
      transition('void => *', [
        animate(
          1000,
          keyframes([
            style({
              transform: 'translateX(-100px)',
              opacity: 0,
              offset: 0,
            }),
            style({
              transform: 'translateX(-50px)',
              opacity: 0.5,
              offset: 0.3,
            }),
            style({
              tansform: 'translateX(-20px)',
              opacity: 1,
              offset: 0.8,
            }),
            style({
              tansform: 'translateX(0px)',
              opacity: 1,
              offset: 1,
            }),
          ])
        ),
      ]),
      transition('* => void', [
        group([
          animate(
            300,
            style({
              color: 'red',
            })
          ),
          animate(
            800,
            style({
              transform: 'translateX(100px)',
              opacity: 0,
            })
          ),
        ]),
      ]),
    ]),
  ],
})
export class HomeComponent implements OnInit {

  // main() {
  //   notifications.main()
  // }
  // getNotifications() {
  //   notifications.getNotifications()
  // }
animationEnded($event: AnimationEvent) {
console.log($event);
}
animationStarted($event: AnimationEvent) {
  console.log($event);
}
  userLoggedIn: {} = {};
  state = 'normal';
  wildState = 'normal';

  // onAnimate() {
  //   this.state === 'normal'
  //     ? (this.state = 'highlighted')
  //     : (this.state = 'normal');
  //   this.wildState === 'normal'
  //     ? (this.wildState = 'highlighted')
  //     : (this.wildState = 'normal');
  // }

  // onShrink() {
  //   this.wildState = 'shrunken';
  // }

  constructor(private ngbTConfig: NgbTooltipConfig, private auth: AuthService) {
    ngbTConfig.placement = 'bottom';
    ngbTConfig.tooltipClass = 'tooltippp';
    ngbTConfig.animation = true;
    ngbTConfig.closeDelay = 2000;
  }

  ngOnInit(): void {
    this.auth.isLoggedIn().subscribe((user: any) => (this.userLoggedIn = user));
  }
}
