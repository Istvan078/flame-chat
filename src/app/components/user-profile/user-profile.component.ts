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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
  picturesSubscription!: Subscription;
  percent: number = 0;
  pictures!: FileList;
  picturesUrl: any[] = [];
  userProf: UserClass = new UserClass();
  userPictures: any[] = [];
  userBirthDate: string = '';
  newDate: string = new Date().toLocaleString();

  registeredSuccessfully: boolean = false;
  registeredWithPhone!: boolean;
  showPics: boolean = false;

  picturesCarousel: any = document.getElementById('picturesCarousel');

  ngOnDestroy(): void {
    this.profilePicSub.unsubscribe();
    this.picturesSubscription.unsubscribe();
  }

  constructor(
    private router: ActivatedRoute,
    private auth: AuthService,
    private base: BaseService,
    private route: Router
  ) {}

  ngOnInit(): void {
    this.profilePicSub = this.base.profilePicUrlSubject.subscribe(
      (url: string) => {
        this.profilePhotoUrl = url;
      }
    );
    this.picturesSubscription = this.base.picturesSubject.subscribe(url => {
      this.picturesUrl.push(url);
    });
  }

  ngAfterViewInit(): void {
    new Promise(res => {
      this.router.params.subscribe((param: Params) => {
        this.base.getUserProfiles().subscribe((userProfiles: UserClass[]) => {
          const userProfil = userProfiles.filter(
            userProfile => userProfile['uid'] === param['uid']
          );
          this.userProf = Object.assign(this.userProf, ...userProfil);
          if (!this.userProf.profilePicture)
            this.userProf.profilePicture =
              'https://img.freepik.com/free-vector/user-blue-gradient_78370-4692.jpg?t=st=1718095085~exp=1718098685~hmac=dabbb0cd71b6a040cd9dd79f125a765c55fa19402edc1701c52abf887aadfb05&w=1060';
          if (!this.userProf.birthDate) {
            this.registeredSuccessfully = true;
          }
          if (this.userProf) {
            this.userBirthDate = this.userProf.birthDate;
          }
          if (this.userProf.email) {
            this.registeredWithPhone = false;
          } else this.registeredWithPhone = true;
          res('Sikeres profillekérés');
        });
      });
    });
  }

  selectFile(event: any) {
    this.profilePhoto = event.target.files[0];
  }

  saveProfile() {
    new Promise(res => {
      this.auth.isLoggedIn().subscribe((user: any) => {
        this.base.getUserProfiles().subscribe(userProfiles => {
          let userProfile = userProfiles.filter(
            (userProfile: any) => userProfile.uid === user.uid
          );

          this.userProf.uid = user.uid;
          this.userProf.key = userProfile[0].key;
          // this.userProf.ageCalc();
          if (this.profilePhotoUrl) {
            this.userProf.profilePicture = this.profilePhotoUrl;
          } else if (!this.userProf.profilePicture) {
            this.userProf.profilePicture =
              'https://img.freepik.com/free-vector/user-blue-gradient_78370-4692.jpg?t=st=1718095085~exp=1718098685~hmac=dabbb0cd71b6a040cd9dd79f125a765c55fa19402edc1701c52abf887aadfb05&w=1060';
          } else {
            this.userProf.profilePicture = userProfile[0].profilePicture;
          }
          res('Sikeres Profil frissítés');
        });
      });
    })
      .then(res => {
        this.base.updateUserData(this.userProf, this.userProf.key);
      })
      .then(() => this.route.navigate(['chat']));
  }

  addProfilePic() {
    this.base
      .addProfilePicture(this.profilePhoto)
      .subscribe(percent => (this.percent = percent!));
  }

  changeProfilePic() {
    this.userProf.profilePicture = '';
    this.base.addProfilePicture(this.profilePhoto).subscribe(percent => {
      this.percent = percent?.toFixed(0) as any;
      this.percent = Number(this.percent);
    });
  }
}
