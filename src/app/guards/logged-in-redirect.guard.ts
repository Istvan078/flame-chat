import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const loggedInRedirectGuard: CanMatchFn = (route, segments) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return auth.isUserReadySubj.pipe(
    filter(Boolean),
    switchMap(() =>
      auth.getUserLoggedInSubject().pipe(
        take(1),
        map(user => {
          const routePath = route.path ?? '';
          const requestedUrl = segments.map(s => s.path).join('/');
          const isRootMatch = routePath === '' && !requestedUrl;
          const isLoggedIn = Boolean(user?.uid && user?.emailVerified);
          const isAuthRoute = routePath === 'login' || routePath === 'signup';
          const requiresAuthentication =
            routePath === '' || routePath.startsWith('profile');
          const returnUrl = requestedUrl
            ? `/${requestedUrl}`
            : isRootMatch
            ? '/chat'
            : routePath
            ? `/${routePath}`
            : '/';

          if (isRootMatch && isLoggedIn) {
            return router.createUrlTree(['/chat']);
          }

          if (isAuthRoute && isLoggedIn) {
            return router.createUrlTree(['/chat']);
          }

          if (!isLoggedIn && requiresAuthentication) {
            return router.createUrlTree(['/login'], {
              queryParams: { returnUrl },
            });
          }

          return true;
        })
      )
    )
  );
};
