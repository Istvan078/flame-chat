import { HttpClient } from '@angular/common/http';
import { Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Environments } from 'src/app/environments';
import { MyPost, Post } from 'src/app/models/post.model';
import { Friends, UserClass } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent {
  usersApiUrl = Environments.API_URL;
  activeModal = inject(NgbActiveModal);
  isSelectFriend = false;
  selectedFriend?: Friends;
  selectedValue: any = 'news';
  options = [
    { value: 'news', label: 'Hírfolyam (Hamarosan)', disabled: true },
    { value: 'friend-profile', label: 'Ismerős profiljában' },
  ];
  @Input() name: string = '';
  @Input() friendName: string = '';
  @Input() userName: string = '';
  @Input() user!: UserClass;
  @Input() userFriends?: Friends[];
  @Input() uid: string = '';
  @Input() userEmail: string = '';
  @Input() post: Post = new Post();
  @Input() likedPeople: any[] = [];
  @Input() isSubscribedToNotif: boolean = true;
  @Input() error: any;
  @Input() isWantToUnsub: boolean = false;

  constructor(
    private http: HttpClient,
    private firestoreService: FirestoreService,
    private toastService: ToastService,
    private baseService: BaseService
  ) {}

  deleteUser() {
    this.http
      .post(this.usersApiUrl + 'deleteUser', { uid: this.uid })
      .subscribe(res => console.log(res));
  }

  chooseFriend(friend: Friends) {
    this.isSelectFriend = false;
    this.selectedFriend = friend;
    this.selectedValue = 'friend';
  }

  backToOptions() {
    this.isSelectFriend = false;
    this.selectedValue = 'news';
    this.selectedFriend = undefined;
  }

  back() {
    this.activeModal.dismiss('Nem');
  }

  subscribeOrUnsubToNotifications() {
    this.activeModal.close('Igen');
  }

  async sharePostOnFriendProfile() {
    // const postShared = await this.firestoreService.createPost(
    //   this.post!
    //   // this.selectedFriend?.friendKey,
    // );
    this.post.newestTimeStamp = new Date().getTime();
    if (this.selectedFriend?.friendKey) {
      const sharedWithMe = {
        byWhoKey: this.user.key,
        friendUid: this.user.uid,
        myKey: this.selectedFriend.friendKey,
        timeStamp: new Date().getTime(),
      };
      if (!this.post.userKeys?.length) {
        this.post.userKeys = [this.selectedFriend.friendKey];
        const sharedPostWithFriend = await this.firestoreService.updatePost(
          this.post.id,
          { userKeys: [this.selectedFriend.friendKey] }
        );
      }
      if (this.post.userKeys?.length) {
        if (!this.post.userKeys.includes(this.selectedFriend.friendKey)) {
          const sharedPostWithFriend = await this.firestoreService.updatePost(
            this.post.id,
            { userKeys: [...this.post.userKeys, this.selectedFriend.friendKey] }
          );
        }
      }
      ////////////// LEÍRÁS  /////////
      // Még nincs megosztva senkivel a poszt
      if (!this.post.sharedWithMe?.length) {
        this.post.sharedWithMe = [sharedWithMe];
        console.log('Még nincs megosztva senkivel');
        const sharedPostWithFriend = await this.firestoreService.updatePost(
          this.post.id,
          {
            sharedWithMe: [sharedWithMe],
            newestTimeStamp: this.post.newestTimeStamp,
          }
        );
        ////////////// LEÍRÁS  /////////
        // Már megvan osztva velem a poszt
      } else if (this.post.userKeys.includes(this.selectedFriend.friendKey)) {
        const num2 = this.post.sharedWithMe.findIndex(
          sWithMe => sWithMe.myKey === this.selectedFriend?.friendKey
        );
        this.post.sharedWithMe.splice(num2, 1);
        const sharedPostWithFriend = await this.firestoreService.updatePost(
          this.post.id,
          {
            sharedWithMe: [...this.post.sharedWithMe, sharedWithMe],
            newestTimeStamp: this.post.newestTimeStamp,
          }
        );
        this.post.sharedWithMe.push(sharedWithMe);
      } else {
        ////////////// LEÍRÁS  /////////
        // Már megvan osztva valakivel a poszt, de nem velem
        const sharedPostWithFriend = await this.firestoreService.updatePost(
          this.post.id,
          {
            sharedWithMe: [...this.post.sharedWithMe, sharedWithMe],
            newestTimeStamp: this.post.newestTimeStamp,
          }
        );
        this.post.sharedWithMe.push(sharedWithMe);
        this.post.userKeys.push(this.selectedFriend.friendKey);
      }
      const friendPosts = await this.firestoreService.getMyPosts(
        this.selectedFriend.friendKey
      );
      const alreadyHasThisPost = friendPosts.find((fP: MyPost) => {
        return fP.fromPostId === this.post.id;
      });
      if (!alreadyHasThisPost?.fromPostId) {
        const forMyPrivatePost: MyPost = {
          fromPostId: this.post.id,
          seen: false,
          liked: [],
          comments: [],
        };
        const myPostRef = await this.firestoreService.createMyPost(
          forMyPrivatePost,
          this.selectedFriend.friendKey
        );
        await this.firestoreService.updateMyPost(
          this.selectedFriend.friendKey,
          myPostRef.id,
          { id: myPostRef.id }
        );
      }

      // this.firestoreService.getMyPostsNotiSubj().next();
    }

    this.firestoreService.sharedPostIdSubject.next(this.post.id);
    this.baseService.selectedFriendSubject.next(this.selectedFriend);
    this.toastService.addToast(
      'Sikeres megosztás',
      this.selectedFriend?.displayName + ' nevű felhasználóval'
    );
    this.activeModal.close();
  }

  onOptionSelected(event: any) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedValue = selectElement.value;
    if (this.selectedValue === 'friend-profile') {
      this.isSelectFriend = true;
    }
  }
}
