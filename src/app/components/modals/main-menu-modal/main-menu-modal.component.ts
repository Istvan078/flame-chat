import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UserClass } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { UtilityService } from 'src/app/services/utility.service';

@Component({
  selector: 'app-main-menu-modal',
  templateUrl: './main-menu-modal.component.html',
  styleUrl: './main-menu-modal.component.scss',
})
export class MainMenuModalComponent implements OnInit {
  blockedPeople: any[] = [];
  userProfiles: UserClass[] = [];
  blockedPeopleUidsArr: string[] = [];
  userProfile: UserClass = new UserClass();
  constructor(
    public dialogRef: MatDialogRef<MainMenuModalComponent>,
    private util: UtilityService,
    private base: BaseService
  ) {}

  ngOnInit(): void {
    this.userProfiles = this.util.userProfiles;
    this.userProfile = this.util.userProfile;
    if (this.blockedPeople.length) {
      this.blockedPeopleUidsArr = this.blockedPeople;
      const blockedProfs = this.userProfiles.filter(usr =>
        this.blockedPeople.includes(usr.uid)
      );
      this.blockedPeople = blockedProfs;
    }
  }

  unblockPerson(person: any, i: number) {
    this.blockedPeopleUidsArr.splice(i, 1);
    this.blockedPeople = this.blockedPeople.filter(bP => bP.uid !== person.uid);
    this.userProfile.blockedPeople = this.blockedPeopleUidsArr;
    this.base.updateUserData(this.userProfile, this.userProfile.key);
    if (this.blockedPeople.length === 0) this.dialogRef.close();
  }
}
