import { Component, ViewChild} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';

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
  userProfiles: any
  genderr: any

  constructor(
    private authService: AuthService,
    private router: Router,
    private base: BaseService
  ){}

  emailSuggestion() {
    this.signupForm.form.patchValue({
      email: "pelda078@gmail.com"
    })
  }

  createUserWithEmAndPa(){
    this.authService.createUserWithEmAndPa(this.email, this.password);
    this.router.navigate(['login']);

    // this.signupForm.reset();
    // this.isLoggedIn = "";
  }

}
