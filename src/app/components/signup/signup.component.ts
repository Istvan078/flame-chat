import { Component} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})


export class SignupComponent {
  email: string = "";
  password: string = "";
  isLoggedIn: any;
  

  constructor(
    private authService: AuthService,
    private router: Router
  ){}

  createUserWithEmAndPa(){
    this.authService.createUserWithEmAndPa(this.email, this.password);
    
    this.router.navigate(['login']);
    this.isLoggedIn = "";
  }

}
