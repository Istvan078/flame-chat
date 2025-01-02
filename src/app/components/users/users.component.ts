import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { ModalComponent } from '../modals/modal/modal.component';
import { BaseService } from 'src/app/services/base.service';
import { Environments } from 'src/app/environments';
import { UtilityService } from 'src/app/services/utility.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy {
  isSideNavOn: boolean = false;
  isReadyToDeleteProf: boolean = false;
  userDisplayOn: boolean = false;
  user: UserClass = new UserClass();
  userProfile: UserClass = new UserClass();
  userProfiles: UserClass[] = [];
  loggedInUser: UserClass = new UserClass();
  columns: string[] = [
    'Megjelenítési név',
    'Profilkép',
    'Email-cím',
    'Jogosultságok',
  ];
  users: UserClass[] = [];
  usersApiUrl = Environments.API_URL;
  @ViewChild('saveChanges', { static: false }) saveChanges!: ElementRef;
  @ViewChild('sidenav') sidenav!: MatSidenav;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private modalRef: NgbModal,
    private base: BaseService,
    private utilService: UtilityService
  ) {}

  ngOnInit(): void {
    this.authService.getUsersSubject().subscribe((users: UserClass[]) => {
      users.map(user => {
        user['isRenderOn'] = false;
      });
      this.users = users;
      this.getLoggedInUser();
      this.base.getUserProfiles().subscribe(uPfs => (this.userProfiles = uPfs));
      if (this.loggedInUser?.uid)
        this.userProfile = this.userProfiles.find(
          uP => uP.uid === this.loggedInUser.uid
        )!;
    });
  }

  changeClaims(user: any) {
    this.authService.setCustomClaims(user.uid, user.claims);
    setTimeout(() => {
      this.saveChanges.nativeElement.disabled = false;
      this.saveChanges.nativeElement.style.backgroundColor = 'darkgreen';
    }, 1000);
  }

  save() {
    this.authService.navDisappear.next(false);
    this.router.navigate(['']);
  }

  getLoggedInUser() {
    this.authService
      .getUserLoggedInSubject()
      .subscribe(u => (this.loggedInUser = u));
  }

  getIndexOfUser(index: number) {
    this.user = this.users[index];
  }

  getUserProfiles() {
    this.base.getUserProfiles().subscribe(uPfs => (this.userProfiles = uPfs));
    this.userProfiles.forEach(uP => {
      if (!uP?.age && uP?.age !== 0 && uP.birthDate) {
        const uProf = new UserClass('', uP.birthDate);
        uProf?.ageCalc();
        const updatedAge = { age: uProf.age };
        this.base.updateUserData(updatedAge, uP.key);
      }
      this.users.map(user => {
        if (user.uid === uP.uid) user.curPosition = uP.curPosition;
        console.log(user);
        if (uP.lastTimeOnline) {
          const lastTOnlineDate = new Date(uP.lastTimeOnline);
          const formattedDateStr =
            this.utilService.calcMinutesPassed(lastTOnlineDate);
          if (user.uid === uP.uid)
            user['lastTimeOnline' as string] = formattedDateStr;
        }
      });
    });
    console.log(this.users);
  }

  getCurPosition(curPos: string) {
    const url = `https://www.google.com/maps/@${curPos},13z`;
    open(url);
  }

  removeUserProfile() {
    const selectedUser = this.userProfiles.find(uP => uP.uid === this.user.uid);
    if (selectedUser) this.base.removeUserProfile(selectedUser.key);
  }

  getUsers() {
    return this.http
      .get<UserClass[]>(this.usersApiUrl + 'users', {
        headers: this.authService.httpHeaders,
      })
      .subscribe(users => (this.users = users));
  }

  setUserProfile() {
    this.http
      .post(this.usersApiUrl + 'setUserProfile', this.user)
      .subscribe(res => {
        this.getUsers();
      });
  }

  sureToDeleteUser() {
    const actModal = this.modalRef.open(ModalComponent, {
      centered: true,
    });
    if (this.user.displayName) {
      actModal.componentInstance.userName = this.user.displayName;
    } else {
      actModal.componentInstance.userName = 'Névtelen felhasználó';
    }
    actModal.componentInstance.uid = this.user.uid;
    actModal.result.then(() => this.getUsers()).catch(err => console.log(err));
  }

  showNavAgain() {
    this.authService.navDisappear.next(false);
  }

  ngOnDestroy(): void {
    this.authService.navDisappear.next(false);
  }
}
