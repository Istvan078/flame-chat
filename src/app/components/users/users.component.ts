import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent {
  columns: string[] = ["Megjelenítési név", "Profilkép", "Email-cím", "Jogosultságok"]

  users: any;


  constructor(private authService: AuthService) {
    this.authService.getUsers()?.subscribe((users:any) => {
      this.users = users
    })
  }

  save(user:any) {
    this.authService.setCustomClaims(user.uid, user.claims)
  }
}
