import { Component, Inject, Input } from '@angular/core';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from '@angular/material/snack-bar';

@Component({
  selector: 'app-snackbar',
  templateUrl: './snackbar.component.html',
  styleUrl: './snackbar.component.scss',
})
export class SnackbarComponent {
  @Input() aiLimitReached = false;
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: { message: string },
    public ref: MatSnackBarRef<SnackbarComponent>
  ) {}
}
