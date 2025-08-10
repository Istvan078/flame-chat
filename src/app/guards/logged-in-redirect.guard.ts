import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, switchMap } from 'rxjs';

export const loggedInRedirectGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  return auth.isUserReadySubj.pipe(
    filter(ready => ready),
    switchMap(() => auth.getUserLoggedInSubject()),
    map(usr => {
      let path: any;
      if (route.url[0]?.path) {
        [{ path }] = route.url;
      }
      if (path === undefined && usr?.uid) return true;
      if (usr?.uid) return new RedirectCommand(router.parseUrl(''));
      if (!path && !usr?.uid)
        return new RedirectCommand(router.parseUrl('/login'));
      if (usr?.uid && auth.isUserReadySubj.value === true) {
        auth.isUserReadySubj.next(false);
        // Ha már be van jelentkezve, irányítsuk át
        return new RedirectCommand(router.parseUrl(''));
      }
      return true; // engedjük a belépést
    })
  );
};
