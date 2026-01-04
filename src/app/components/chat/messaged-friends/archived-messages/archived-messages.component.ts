import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from 'src/app/components/shared/shared.module';
import { UserClass } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { UtilityService } from 'src/app/services/utility.service';

@Component({
  selector: 'app-archived-messages',
  templateUrl: './archived-messages.component.html',
  styleUrl: './archived-messages.component.scss',
  standalone: true,
  imports: [SharedModule],
})
export class ArchivedMessagesComponent implements OnInit {
  archivedFriendsMess: any[] = [];
  @Input() lastMsgsWithFriends: any[] = [];
  userProfile: UserClass = new UserClass();
  // @Output() toFriendsMessage = new EventEmitter();
  // @Output() cancelArchiFriend = new EventEmitter();
  userFriends: any[] = [];
  isMessMenu: boolean = false;
  constructor(
    private router: Router,
    private utilServ: UtilityService,
    private base: BaseService
  ) {}

  async ngOnInit() {
    if (this.utilServ.archivedFriends.length > 0) {
      this.archivedFriendsMess = this.utilServ.archivedFriends;
    }
  }
  async getMessageUser(mess: any) {
    this.router.navigate(['/message/' + mess.friendId]);
  }
  cancelArchFriend(i: number, friend: any) {
    this.userProfile = this.utilServ.userProfile;
    this.archivedFriendsMess.splice(i, 1);
    const body: any = { archived: false, archivedAftNewMess: false };
    friend.archived = false;
    friend.archivedAftNewMess = false;
    this.base.updateFriend(friend.friendKey, body, this.userProfile.key);
    this.utilServ.archFriendsUidsArr.splice(i, 1);
    // this.cancelArchiFriend.emit(friend);
  }
}
