import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit{
  
  isLoggedIn: any;
  isSuperAdmin: boolean = false;
  constructor(
    private authService: AuthService
    ){
    }
  
  ngOnInit(): void {
      this.authService.isLoggedIn().subscribe({
      
          next: (user) => {
            console.log(user)
            if(user?.emailVerified==true || user?.providerData[0]?.providerId=="facebook.com" || user?.providerData[0]?.providerId == "phone")
            this.isLoggedIn=user
            else{user?.sendEmailVerification()
            this.isLoggedIn=""}
          },
          error: (err) => console.log(err)
      })
      this.authService.isSuperAdmin.subscribe((booleanSA)=> {
        this.isSuperAdmin = booleanSA
      })
  }

  signOut() {
    this.authService.signOut();
    this.isSuperAdmin = false;
  }
}
