import { Component, Input, input, InputSignal, ViewChild } from '@angular/core';

@Component({
  selector: 'app-mat-modal',
  templateUrl: './mat-modal.component.html',
  styleUrl: './mat-modal.component.scss',
})
export class MatModalComponent {
  @Input() isUpdateForApp: boolean = false;
  @Input() isPosted: boolean = false;
  @Input() isUnauthorized: boolean = false;
}
