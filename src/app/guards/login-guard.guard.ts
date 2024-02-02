import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginGuardGuard: CanActivateFn = (route, state) => {
  return inject(AuthService).isLoggedInBoolean();
};
