import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserClass } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { UtilityService } from 'src/app/services/utility.service';
import { FilesModalComponent } from '../../modals/files-modal/files-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
  animations: [
    trigger('fade-in', [
      state(
        'in-2',
        style({
          opacity: 0,
          transform: 'scale(0)',
        })
      ),
      state(
        'normal',
        style({
          opacity: 1,
          transform: 'scale(1)',
        })
      ),
      transition('in-2 => normal', [
        animate(
          500,
          keyframes([
            style({
              transform: 'scale(0.2)',
              opacity: 0.3,
              offset: 0.3,
            }),
            style({
              transform: 'scale(0.5)',
              opacity: 1,
              offset: 0.6,
            }),
            style({
              transform: 'scale(1)',
              opacity: 1,
              offset: 1,
            }),
          ])
        ),
      ]),
    ]),
  ],
})
export class MessageComponent implements OnInit {
  @Input() visibleMessages: any[] = [];
  @Input() selectedFriend: any;
  @Input() sentFilesArr: any[] = [];
  @Input() textMessages: any;
  @Input() urlText: any;
  @Input() messageButtonClicked: boolean = false;
  // ANIMÁCIÓVAL KAPCSOLATOS //
  chatAnimationState: string = 'normal';

  allChatsArray: any[] = [];

  userProfiles: UserClass[] = [];
  userProfile: UserClass = new UserClass();

  searchWord: string = '';

  getAllMessagesSubjectSub!: Subscription;
  userSubjectSub!: Subscription;

  constructor(
    private utilService: UtilityService,
    private base: BaseService,
    private ngbModal: NgbModal
  ) {}

  ngOnInit(): void {
    this.getAllMessagesSubjectSub = this.base.getAllMessagesSubject.subscribe(
      obj => {
        if (obj.allChatsArray) this.allChatsArray = obj.allChatsArray;
      }
    );

    this.userSubjectSub = this.utilService.userSubject.subscribe(user => {
      if (user.userProfiles) this.userProfiles = user.userProfiles;
      if (user.userProfile) {
        this.userProfile = user.userProfile;
        // if (!this.userProfile.displayName) {
        //   this.router.navigate([`/profile/${this.userProfile.uid}`])
        // }
      }
      // if (user.userNotFriends) this.userNotFriends = user.userNotFriends;
      // if (user.userFriends) this.userFriends = user.userFriends;
      // if (user.notConfirmedMeUsers)
      //   this.notConfirmedMeUsers = user.notConfirmedMeUsers;
      // if (user.subscription) user.subscription.unsubscribe();
      // if (!this.notConfirmedMeUsers.length) this.confirmFriend();
      // if (this.notConfirmedMeUsers.length || this.userNotFriends.length)
      //   this.friendsOn = true;
    });
    this.animateMessages();
  }

  onAnimate() {
    this.chatAnimationState =
      this.chatAnimationState === 'normal' ? 'in-2' : 'normal';
  }

  animateMessages() {
    console.log(this.chatAnimationState);
    this.chatAnimationState =
      this.chatAnimationState === 'in-2' ? 'normal' : 'normal';
  }

  fileModalOpen(picturesArr: [], i: number) {
    const modalRef = this.ngbModal.open(FilesModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.picturesArr = picturesArr;
    modalRef.componentInstance.viewIndex = i;
  }
}
