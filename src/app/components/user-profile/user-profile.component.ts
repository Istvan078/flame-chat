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
import { Observable, Subscription } from 'rxjs';
import { FirebaseUser, UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UtilityService } from 'src/app/services/utility.service';
import { FilesModalComponent } from '../modals/files-modal/files-modal.component';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('f') form!: NgForm;
  @ViewChild('profilePic')
  chosenProfPicFromUploads!: ElementRef<HTMLImageElement>;
  users: UserClass[] = [];
  genders: string[] = ['Férfi', 'Nő'];
  profilePhotoUrl!: string;
  profilePhoto!: File;
  userProfile: UserClass[] = [];
  profilePicSub!: Subscription;
  picturesSubscription!: Subscription;
  updateChosenImageSub!: Subscription;
  userProfilesSub!: Subscription;
  percent: number = 0;
  pictures!: FileList;
  picturesUrl: any[] = [];
  userProf: UserClass = new UserClass();
  userPictures: any[] = [];
  userBirthDate: string = '';
  newDate: string = new Date().toLocaleString();
  chosenProfPic: any;
  chosenProfilePicInterval: any;

  registeredSuccessfully: boolean = false;
  registeredWithPhone!: boolean;
  showPics: boolean = false;

  picturesCarousel: any = document.getElementById('picturesCarousel');
  uploadFinished: boolean = false;

  /////////////////////// TESZT ALATT VAN ////////////
  isLoading: boolean = false;
  error: string = '';
  index: number = 0;
  isLeftArrow: boolean = false;
  isRightArrow: boolean = false;
  profilePicsArr: any[] = [];
  filteredProfilePicsArr: any[] = [];

  constructor(
    private router: ActivatedRoute,
    private auth: AuthService,
    private base: BaseService,
    private route: Router,
    private utilityService: UtilityService,
    private modalRef: NgbModal
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
    new Promise(res => {
      this.router.params.subscribe((param: Params) => {
        if (!this.userProf?.uid)
          this.userProfilesSub = this.base
            .getUserProfiles()
            .subscribe(async (userProfiles: UserClass[]) => {
              const userProfil = userProfiles.filter(
                userProfile => userProfile['uid'] === param['uid']
              );
              this.userProf = Object.assign(this.userProf, ...userProfil);
              console.log(this.profilePicsArr);
              if (!this.userProf.profilePicture)
                this.userProf.profilePicture =
                  'https://img.freepik.com/free-vector/user-blue-gradient_78370-4692.jpg?t=st=1718095085~exp=1718098685~hmac=dabbb0cd71b6a040cd9dd79f125a765c55fa19402edc1701c52abf887aadfb05&w=1060';
              this.filteredProfilePicsArr = (await this.base.getProfilePictures(
                this.userProf.email!
              )) as any[];
              this.init();
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
              this.userProfilesSub.unsubscribe();
            });
      });
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.chosenProfPic = document.querySelector('.mainContainer')! as any;
      // this.chosenProfPic.addEventListener('mouseenter', e => {
      //   console.log(e.target);
      //   this.chosenProfPic.src =
      //     this.chosenProfPicFromUploads.nativeElement.src;
      // });
      (this.chosenProfPic as any) = this.chosenProfPicFromUploads;
      console.log(this.chosenProfPic);
    }, 1000);
    // this.updateChosenImageSub = new Observable(observer => {
    this.chosenProfilePicInterval = setInterval(() => {
      if (
        this.chosenProfPic?.nativeElement.src !==
        this.chosenProfPicFromUploads?.nativeElement.src
      ) {
        (this.chosenProfPic as any) = this.chosenProfPicFromUploads;
        // this.updateChosenImageSub.unsubscribe();
        // clearInterval(this.chosenProfilePicInterval);
      }

      console.log('fut az interval');
      if (this.index < this.filteredProfilePicsArr.length - 1)
        this.isRightArrow = true;
    }, 1000);
    // }).subscribe();
  }

  selectFile(event: any) {
    this.profilePhoto = event.target.files[0];
  }

  saveProfile() {
    new Promise(res => {
      this.auth.isLoggedIn().subscribe(async (user: FirebaseUser) => {
        if (!user?.displayName) {
          await user?.updateProfile({
            displayName: this.userProf.displayName,
          });
          console.log('SIKERES FELHASZNÁLÓI PROFIL FRISSÍTÉS');
        }
        if (!this.userProf.age) this.userProf.ageCalc();
        if (this.profilePhotoUrl) {
          this.userProf.profilePicture = this.profilePhotoUrl;
        } else if (!this.userProf.profilePicture) {
          this.userProf.profilePicture =
            'https://img.freepik.com/free-vector/user-blue-gradient_78370-4692.jpg?t=st=1718095085~exp=1718098685~hmac=dabbb0cd71b6a040cd9dd79f125a765c55fa19402edc1701c52abf887aadfb05&w=1060';
        }
        res('Sikeres Profil frissítés');
      });
    })
      .then(async res => {
        console.log(this.userProf.profilePicture);
        await this.base.updateUserData(this.userProf, this.userProf.key);
        if (this.userProf.displayName) {
          this.utilityService.forUserSubject.userProfile = this.userProf;
          this.utilityService.userSubject.next(
            this.utilityService.forUserSubject
          );
        }
      })
      .then(() => this.route.navigate(['chat']));
  }

  addOrChangeProfilePic() {
    this.uploadFinished = false;
    const maxWidth = 1440;
    const maxHeight = 768;
    const quality = 0.8; // Tömörítési szint (0.0 - 1.0)
    this.utilityService
      .resizeImage(this.profilePhoto, maxWidth, maxHeight, quality)
      .then(resizedBlob => {
        console.log(resizedBlob);
        const resizedFile = new File([resizedBlob], this.profilePhoto.name, {
          type: 'image/jpg',
        });
        this.base
          .addProfilePicture(resizedFile, this.userProf.email!)
          .subscribe(percent => {
            this.percent = percent?.toFixed(0) as any;
            this.percent = Number(this.percent);
            if (this.percent === 100 && !this.uploadFinished) {
              this.uploadFinished = true;
              this.profilePhoto = new File([], '');
              const fileModal = this.modalRef.open(FilesModalComponent, {
                centered: true,
              });
              fileModal.componentInstance.picturesUploaded = true;
              console.log('****SIKERS FELTÖLTÉS****');
            }
          });
      })
      .catch(err => console.log(err));
  }

  ///////////////////////////// TESZT ALATT VAN ////////////////////

  init() {
    return new Promise(res => {
      this.fadeIn();
      this.filterProfilePics();
    });
  }

  toLeft() {
    if (this.index > 0 && window.innerWidth > 500) {
      this.isRightArrow = true;
      this.index--;
      this.profilePicsArr = this.filteredProfilePicsArr.slice(
        this.index,
        this.index + 1
      );
      this.fadeIn();
    } else {
      this.isRightArrow = true;
      this.index--;
      this.profilePicsArr = this.filteredProfilePicsArr.slice(
        this.index,
        this.index + 1
      );
      this.fadeIn();
    }
    if (this.index <= 0) {
      this.isLeftArrow = false;
    }
  }

  toRight() {
    if (
      this.index < this.filteredProfilePicsArr.length - 1 &&
      window.innerWidth > 500
    ) {
      this.isLeftArrow = true;
      this.index++;
      if (this.index >= this.filteredProfilePicsArr.length - 1)
        this.isRightArrow = false;
      this.profilePicsArr = this.filteredProfilePicsArr.slice(
        this.index,
        this.index + 1
      );
      this.fadeInOnClick();
    } else {
      this.isLeftArrow = true;
      this.index++;
      if (this.index >= this.filteredProfilePicsArr.length - 1)
        this.isRightArrow = false;
      this.profilePicsArr = this.filteredProfilePicsArr.slice(
        this.index,
        this.index + 1
      );
      this.fadeIn();
    }
  }

  filterProfilePics() {
    // if (window.innerWidth > 500)
    //   this.profilePicsArr = this.filteredProfilePicsArr.slice(0, 3);
    // else
    setTimeout(() => {
      const profPhotoIndex = this.filteredProfilePicsArr.findIndex(
        url => url === this.userProf.profilePicture
      );
      const deletedProfPicUrlArr = this.filteredProfilePicsArr.splice(
        profPhotoIndex,
        1
      );
      this.filteredProfilePicsArr.unshift(deletedProfPicUrlArr[0]);
      this.profilePicsArr = this.filteredProfilePicsArr.slice(0, 1);
      this.fadeIn();
      console.log(this.profilePicsArr);
    }, 100);

    //this.profilePicsArr = deepmerge(this.profilePicsArr, []);
    // this.filteredProfilePicsArr = deepmerge(
    //   this.filteredProfilePicsArr,
    //   []
    // );
  }

  fadeIn() {
    const products = document.getElementsByClassName('products');
    let index = 0;
    const interval = setInterval(() => {
      if (index < products.length) {
        products[1]?.classList.remove('full-opacity');
        products[index].classList.add('fade-in');
        index++;
      } else {
        clearInterval(interval);
      }
    }, 500);
  }

  fadeInOnClick() {
    const products = document.getElementsByClassName('products');
    let index = 3;
    const interval = setInterval(() => {
      if (index === products.length) {
        products[0].classList.add('full-opacity');
        // products[1].classList.add('full-opacity');

        // if(!products[0].classList.contains('fade-in'))
        //   products[0].classList.add('fade-in')
        // if(!products[1].classList.contains('fade-in'))
        //   products[1].classList.add('fade-in')
        products[index - 1].classList.add('fade-in');
        index++;
      } else {
        if (!products[0]?.classList.contains('fade-in'))
          products[0].classList.add('fade-in');
        // if (!products[1]?.classList.contains('fade-in'))
        //   products[1].classList.add('fade-in');
        products[0].classList.remove('full-opacity');
        // products[1].classList.remove('full-opacity');
        clearInterval(interval);
      }
    }, 500);
  }

  updateProfilePic() {
    const picUrl = this.chosenProfPicFromUploads?.nativeElement.src;
    this.base.updateUserData({ profilePicture: picUrl }, this.userProf.key);
  }

  ngOnDestroy(): void {
    this.profilePicSub.unsubscribe();
    this.picturesSubscription.unsubscribe();
    clearInterval(this.chosenProfilePicInterval);
    if (this.updateChosenImageSub) this.updateChosenImageSub.unsubscribe();
    if (this.userProfilesSub) this.userProfilesSub.unsubscribe();
  }
}
