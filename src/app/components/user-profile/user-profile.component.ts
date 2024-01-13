import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements AfterViewInit, OnInit{
   @ViewChild("f") form!: NgForm
  users: UserClass[] = []
   genders: string[] = ["Férfi", "Nő"]
   profilePhotoUrl!: string 
   profilePhoto!: File
   userProfile: UserClass[] = []
   userProfileOn: boolean = false
  constructor(private router: ActivatedRoute,
    private auth: AuthService,
    private base: BaseService
    ) {

      
  }

  ngOnInit(): void {

    this.base.userProfileSubject.subscribe(
      (userProf: UserClass[]) => {
        this.userProfile = userProf
        this.userProfileOn = true
        console.log(this.userProfile)
        

      }
    )
  }



  ngAfterViewInit(): void {
    setTimeout(() => {
      this.router.params.subscribe(
        (param: Params) => {
  
          console.log(param["uid"])
          this.auth.getUsers().subscribe(
            (users:UserClass[]) => {
              const user: any[] = users.filter(
                (user:any) => user.uid === param["uid"]
               )
                
                this.users = user
                console.log(user)
            }
          )

          this.base.getUserProfiles().subscribe(
            (userProfiles: UserClass[]) => {
            
            const userProfil = userProfiles.filter(
              (userProfile) => userProfile['uid'] === param["uid"]
              
              )
              this.userProfile = userProfil
            }
          )
        }
      )


    }, 5000);

  }

  selectFile(event: any) {
    console.log(event.target.files[0])
    this.profilePhoto = event.target.files[0]
  }

  saveProfile() {
    

    this.auth.isLoggedIn().subscribe(
      (user) => {
        this.base.getUserProfiles().subscribe(
          (userProfiles) => {
            let userProfile = userProfiles.filter(
              (userProfile:any) => userProfile.uid === user?.uid
              
            )
            let userProfileKey = userProfile[0].key
            console.log(userProfile)
            let formValues = this.form.value 
            if(userProfile[0].profilePicture === "" || userProfile[0].profilePicture === undefined){
            this.base.addProfilePicture(this.profilePhoto)
            } else {
              
            this.base.updateUserData(formValues, userProfileKey as string)
          }
            this.base.profilePicUrlSubject.subscribe(
              (photoUrl: string) =>{
                 formValues.profilePicture = photoUrl
                 formValues.uid = user?.uid
                 //this.base.addUserData(formValues)
                 this.base.updateUserData(formValues, userProfileKey as string)
              }
            )
          }
        )
        

      }
    )

    
  }

}
