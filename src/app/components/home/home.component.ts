import { ViewEncapsulation } from '@angular/core';
import { Component } from '@angular/core';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent {
  constructor(private ngbTConfig: NgbTooltipConfig){
    ngbTConfig.placement = "bottom"
    ngbTConfig.tooltipClass = "tooltippp"
    ngbTConfig.animation = true
    ngbTConfig.closeDelay = 2000
  }
}
