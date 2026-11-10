import { PeopleService } from 'src/app/features/people/people.service';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { UserClass } from 'src/app/features/people/user.model';
import { UtilityService } from 'src/app/services/utility.service';
import { MainMenuModalComponent } from '../main-menu-modal/main-menu-modal.component';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrl: './main-menu.component.scss',
  standalone: false,
})
export class MainMenuComponent implements OnInit {
  userProfile = new UserClass();
  lang = '';
  constructor(
    private utilService: UtilityService,
    private baseService: PeopleService,
    private translateService: TranslateService,
    private matDialog: MatDialog
  ) {}
  ngOnInit(): void {
    this.getUserProfile().subscribe(usr => {
      this.userProfile = usr;
    });
    this.lang = localStorage.getItem('lang') || 'hu';
  }

  getUserProfile(): Observable<UserClass> {
    return new Observable(subscriber => {
      const int = setInterval(() => {
        if (this.utilService.userProfile?.key) {
          subscriber.next(this.utilService.userProfile);
          clearInterval(int);
        }
      }, 200);
    });
  }

  changeVisibility() {
    this.userProfile.visibility = !this.userProfile.visibility;
    this.baseService.updateUserData(
      { visibility: this.userProfile.visibility },
      this.userProfile.key
    );
  }
  changeLang(lang: any) {
    const selectedLang = lang;
    console.log(lang);
    localStorage.setItem('lang', selectedLang);
    this.translateService.use(selectedLang);
  }
  showBlockedPeople() {
    if (this.userProfile?.blockedPeople) {
      const dialogRef = this.matDialog.open(MainMenuModalComponent, {});
      dialogRef.componentInstance.blockedPeople =
        this.userProfile.blockedPeople;
    }
  }
}
