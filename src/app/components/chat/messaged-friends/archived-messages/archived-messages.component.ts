import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UserClass } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { UtilityService } from 'src/app/services/utility.service';

@Component({
  selector: 'app-archived-messages',
  templateUrl: './archived-messages.component.html',
  styleUrl: './archived-messages.component.scss',
})
export class ArchivedMessagesComponent implements OnInit {
  @Input() archivedFriendsMess: any[] = [];
  @Input() lastMsgsWithFriends: any[] = [];
  @Input() userProfile: UserClass = new UserClass();
  @Output() toFriendsMessage = new EventEmitter();
  @Output() cancelArchiFriend = new EventEmitter();
  userFriends: any[] = [];
  isMessMenu: boolean = false;
  constructor(private utilServ: UtilityService, private base: BaseService) {}

  async ngOnInit() {}
  getMessageUser(mess: any) {
    this.toFriendsMessage.emit(mess);
  }
  cancelArchFriend(i: number, friend: any) {
    this.archivedFriendsMess.splice(i, 1);
    const body: any = { archived: false, archivedAftNewMess: false };
    friend.archived = false;
    friend.archivedAftNewMess = false;
    this.base.updateFriend(friend.friendKey, body, this.userProfile.key);
    this.utilServ.archFriendsUidsArr.splice(i, 1);
    this.cancelArchiFriend.emit(friend);
  }
}
