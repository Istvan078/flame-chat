import { Component, ViewChild} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})


export class SignupComponent {
  @ViewChild("f") signupForm!: NgForm; 
  email: string = "";
  password: string = "";
  isLoggedIn: any;
  genders: string[] = ["Férfi", "Nő"]
  

  constructor(
    private authService: AuthService,
    private router: Router
  ){}

  emailSuggestion() {
    this.signupForm.form.patchValue({
      email: "pelda078@gmail.com"
    })
  }

  createUserWithEmAndPa(){
    this.authService.createUserWithEmAndPa(this.email, this.password);
    this.authService.loginWithEmAndPa(this.email, this.password);
    this.signupForm.reset();
    this.authService.isLoggedIn().subscribe(
      (user) => {
      this.router.navigate(['profile/'+ user?.uid]);
      }
    )
    
    this.isLoggedIn = "";
  }

}
