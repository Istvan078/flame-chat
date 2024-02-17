import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription, map } from 'rxjs';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { ModalComponent } from '../modals/modal/modal.component';
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
  userBirthDate: string = "";

  registeredSuccessfully: boolean = false

  picturesCarousel: any = document.getElementById("picturesCarousel")

  ngOnDestroy(): void {
    this.profilePicSub.unsubscribe();
    this.picturesSubscription.unsubscribe();
  }

  constructor(
    private router: ActivatedRoute,
    private auth: AuthService,
    private base: BaseService,
    private route: Router,
    private modalService: NgbModal
  ) {  }

  ngOnInit(): void {
    this.profilePicSub = this.base.profilePicUrlSubject.subscribe(
      (url: string) => {
        this.profilePhotoUrl = url;
      }
    );
    this.picturesSubscription = this.base.picturesSubject.subscribe((url) => {
      this.picturesUrl.push(url);
    });

  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.router.params.subscribe((param: Params) => {
        this.auth.getUsers().subscribe((users: UserClass[]) => {
          const user: any[] = users.filter(
            (user: any) => user.uid === param['uid']
          );
          this.users = user;
          
          
        });

        this.base.getUserProfiles().subscribe((userProfiles: UserClass[]) => {
          const userProfil = userProfiles.filter(
            (userProfile) => userProfile['uid'] === param['uid']
          );
          this.userProf = Object.assign(this.userProf, ...userProfil);
          if(!this.userProf.birthDate) {this.registeredSuccessfully = true}
          if(this.userProf){
          this.userBirthDate = this.userProf.birthDate
        }

          this.base.getData(this.userProf).snapshotChanges().pipe(
            map((changes) => changes.map((c) => ({key:c.payload.key, ...c.payload.val()})))
          ).subscribe((pictures) => this.userPictures = pictures)
      
        });
        console.log(this.form.form)

      });
    }, 2000);
  }

  selectFile(event: any) {
    this.profilePhoto = event.target.files[0];
  }

  selectFiles(event: any) {
    this.pictures = event.target.files;
  }

  saveProfile() {
    this.auth.isLoggedIn().subscribe((user: any) => {
      this.base.getUserProfiles().subscribe((userProfiles) => {
        let userProfile = userProfiles.filter(
          (userProfile: any) => userProfile.uid === user.uid
        );
        this.userProf.uid = user.uid;
        if (
          this.userProf.profilePicture == '' ||
          this.userProf.profilePicture == undefined
        ) {
          this.userProf.profilePicture = this.profilePhotoUrl;
        } else {
          this.userProf.profilePicture = userProfile[0].profilePicture;
        }

        this.base.updateUserData(this.userProf, userProfile[0]['key']);
      });
      setTimeout(() => {
        this.route.navigate(['']);
      }, 1000);
    });
  }

  addPictures() {
    Array.from(this.pictures).forEach((file) => {
      this.base
        .addPictures(this.userProf, file)
        .subscribe((percent) => {this.percent = percent!
        });
    });
  }

  toArray() {
   let tomb =  [...this.userProf.pictures]
   console.log(tomb)
  }

  addProfilePic() {
    this.base
      .addProfilePicture(this.profilePhoto)
      .subscribe((percent) => (this.percent = percent!));
  }

  changeProfilePic() {
    this.userProf.profilePicture = '';
    this.base
      .addProfilePicture(this.profilePhoto)
      .subscribe((percent) => (this.percent = percent!));
  }

  deleteUserPicture(file:any, i: number) {
    this.base.deleteUserPicture(this.userProf, file)
  }

  deletePicture(pic: any) {
    this.base.deleteUserPicture(this.userProf, pic)
  }
}
