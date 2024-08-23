import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandlerService {
  constructor() {}

  catchedError(errorMessage: string) {
    return new Error(errorMessage);
  }
}
