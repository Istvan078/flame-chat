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

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit {
  userLoggedIn: {} = {};

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
