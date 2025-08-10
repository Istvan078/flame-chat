import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
})
export class BottomNavComponent {
  constructor(private router: Router) {}

  isRouteActive(path: string): boolean {
    return this.router.url.includes(path);
  }
}
