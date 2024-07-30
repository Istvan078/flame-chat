import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';
import { MatModalComponent } from '../components/modals/mat-modal/mat-modal.component';
import { MatDialog } from '@angular/material/dialog';

export const isAdminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const matDialog = inject(MatDialog);
  return authService.getIsAdminSubj().pipe(
    map(isAdmin => {
      if (isAdmin) return isAdmin;
      router.navigate(['/unauthorized']);
      const matDialogRef = matDialog.open(MatModalComponent);
      matDialogRef.componentInstance.isUnauthorized = true;
      return isAdmin;
    })
  );
};
