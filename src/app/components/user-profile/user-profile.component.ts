import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('f') form!: NgForm;
  users: UserClass[] = [];
  genders: string[] = ['Férfi', 'Nő'];
  profilePhotoUrl!: string;
  profilePhoto!: File;
  userProfile: UserClass[] = [];
  profilePicSub!: Subscription;
  percent: number = 0

  ngOnDestroy(): void {
    this.profilePicSub.unsubscribe();
  }

  constructor(
    private router: ActivatedRoute,
    private auth: AuthService,
    private base: BaseService,
    private route: Router
  ) {}

  ngOnInit(): void {
    this.profilePicSub = this.base.profilePicUrlSubject.subscribe(
      (url: any) => {
        console.log(url);
        this.profilePhotoUrl = url;
        // console.log(this.newProduct.imagesUrl)
      }
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.router.params.subscribe((param: Params) => {
        console.log(param['uid']);
        this.auth.getUsers().subscribe((users: UserClass[]) => {
          const user: any[] = users.filter(
            (user: any) => user.uid === param['uid']
          );
          this.users = user;
          console.log(user);
        });

        this.base.getUserProfiles().subscribe((userProfiles: UserClass[]) => {
          const userProfil = userProfiles.filter(
            (userProfile) => userProfile['uid'] === param['uid']
          );
          this.userProfile = userProfil;
        });
      });
    }, 5000);
  }

  selectFile(event: any) {
    this.profilePhoto = event.target.files[0];
  }

  saveProfile() {
    this.auth.isLoggedIn().subscribe((user) => {
      console.log(user);
      this.base.getUserProfiles().subscribe((userProfiles) => {
        let userProfile = userProfiles.filter(
          (userProfile: any) => userProfile.uid === user?.uid
        );
        let userProfileKey = userProfile[0].key;
        console.log(userProfile);
        let formValues = this.form.value;
        formValues.uid = user?.uid;

        if (
          this.userProfile[0].profilePicture == '' ||
          this.userProfile[0].profilePicture == undefined
        ) {
          formValues.profilePicture = this.profilePhotoUrl;
        } else {
          formValues.profilePicture = userProfile[0].profilePicture;
        }
        // this.base.addUserData(formValues);

        this.base.updateUserData(formValues, userProfileKey as string);
      });
        setTimeout(() => {
          this.route.navigate([""])
        }, 1000);
         
    });
  }

  addProfilePic() {
    this.base.addProfilePicture(this.profilePhoto).subscribe(
      (percent) => this.percent = percent!
    );
  }

  changeProfilePic() {
    this.userProfile[0].profilePicture = '';
    this.base.addProfilePicture(this.profilePhoto).subscribe(
      (percent) => this.percent = percent!
    );
  }
}
