import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit, OnDestroy{
  
  isLoggedIn: any;
  isSuperAdmin: boolean = false;
  isNavDisappeared:boolean = false;
  isMenuClicked: boolean = false;
  constructor(
    private authService: AuthService
    ){
    }
  
  ngOnInit(): void {
      this.authService.isLoggedIn().subscribe({
      
          next: (user) => {
            if(user?.uid || user?.providerData[0]?.providerId=="facebook.com" || user?.providerData[0]?.providerId == "phone")
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

  navDisappear() {
    this.authService.navDisappear.next(true);
    this.authService.navDisappear.subscribe((isTrue: boolean) => {
    this.isNavDisappeared = isTrue
  }
    )
  }
  ngOnDestroy(): void {
    this.authService.navDisappear.unsubscribe();
    console.log("sikeres leiratkozas")
  }
}
