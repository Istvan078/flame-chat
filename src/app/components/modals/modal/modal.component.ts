import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Environments } from 'src/app/environments';
import { MyPost, Post } from 'src/app/models/post.model';
import { Friends, UserClass } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent implements OnInit {
  usersApiUrl = Environments.API_URL;
  activeModal = inject(NgbActiveModal);
  isSelectFriend = false;
  selectedFriend?: Friends;
  isNewsSharing = false;
  selectedValue: any = 'news';
  options = [
    { value: 'news', label: 'Hírfolyam' },
    { value: 'friend-profile', label: 'Ismerős profiljában' },
  ];
  profChange = false;
  @Input() name: string = '';
  @Input() friendName: string = '';
  @Input() userName: string = '';
  @Input() user: UserClass = new UserClass();
  @Input() userFriends?: Friends[];
  @Input() uid: string = '';
  @Input() userEmail: string = '';
  @Input() post: Post = new Post();
  @Input() likedPeople: any[] = [];
  @Input() isSubscribedToNotif: boolean = true;
  @Input() error: any;
  @Input() isWantToUnsub: boolean = false;
  @Input() userOptionsMenu: any;

  constructor(
    private http: HttpClient,
    private firestoreService: FirestoreService,
    private toastService: ToastService,
    private baseService: BaseService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.selectedValue === 'news') this.isNewsSharing = true;
    console.log(this.post);
  }

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

  changeProfile() {
    this.profChange = true;
  }

  signOut() {
    this.authService.signOut();
    this.user = new UserClass();
    this.back();
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
      if (!this.post.sharedWith?.length) {
        this.post.sharedWith = [sharedWithMe];
        console.log('Még nincs megosztva senkivel');
        const sharedPostWithFriend = await this.firestoreService.updatePost(
          this.post.id,
          {
            sharedWith: [sharedWithMe],
            newestTimeStamp: this.post.newestTimeStamp,
          }
        );
        ////////////// LEÍRÁS  /////////
        // Már megvan osztva velem a poszt
      } else if (this.post.userKeys.includes(this.selectedFriend.friendKey)) {
        const num2 = this.post.sharedWith.findIndex(
          sWithMe => sWithMe.myKey === this.selectedFriend?.friendKey
        );
        this.post.sharedWith.splice(num2, 1);
        const sharedPostWithFriend = await this.firestoreService.updatePost(
          this.post.id,
          {
            sharedWith: [...this.post.sharedWith, sharedWithMe],
            newestTimeStamp: this.post.newestTimeStamp,
          }
        );
        this.post.sharedWith.push(sharedWithMe);
      } else {
        ////////////// LEÍRÁS  /////////
        // Már megvan osztva valakivel a poszt, de nem velem
        const sharedPostWithFriend = await this.firestoreService.updatePost(
          this.post.id,
          {
            sharedWith: [...this.post.sharedWith, sharedWithMe],
            newestTimeStamp: this.post.newestTimeStamp,
          }
        );
        this.post.sharedWith.push(sharedWithMe);
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

  // BEFEJEZNI A METÓDUST és Az új tartalmat! // LEÍRÁS
  async sharePostPublicly() {
    console.log(this.post);
    const actualTime = new Date().getTime();
    const forSharingPostPublicly = {
      byWhoKey: this.user.key,
      timeStamp: actualTime,
    };
    if (this.post.sharedPublicly?.length) {
      const alreadySharedByUserInd = this.post.sharedPublicly?.findIndex(
        sh => sh.byWhoKey === this.user.key
      );
      console.log(alreadySharedByUserInd);
      if (alreadySharedByUserInd >= 0) {
        this.post.sharedPublicly?.splice(alreadySharedByUserInd, 1);
      }
    }
    await this.firestoreService.updatePost(this.post.id, {
      sharedPubliclyNewestTimeStamp: actualTime,
      sharedPublicly: this.post.sharedPublicly?.length
        ? [...this.post.sharedPublicly, forSharingPostPublicly]
        : [forSharingPostPublicly],
    });
    this.post.sharedPublicly?.push(forSharingPostPublicly);
    this.toastService.addToast('', 'Sikeres megosztás');
    this.activeModal.close(actualTime);
  }

  onOptionSelected(event: any) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedValue = selectElement.value;
    if (this.selectedValue === 'friend-profile') {
      this.isSelectFriend = true;
      this.isNewsSharing = false;
      console.log(this.isSelectFriend);
      console.log(this.isNewsSharing);
    }
    if (this.selectedValue === 'news') {
      this.isNewsSharing = true;
      this.isSelectFriend = false;
    }
  }
}
