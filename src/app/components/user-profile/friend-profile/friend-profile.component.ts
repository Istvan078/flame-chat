import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserClass } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-friend-profile',
  templateUrl: './friend-profile.component.html',
  styleUrls: ['./friend-profile.component.scss'],
})
export class FriendProfileComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;
  friendProfile: UserClass = new UserClass();
  friendProfileSubscription!: Subscription;
  userProfilesSubscription!: Subscription;

  actIndex: number = 0;
  viewIndex: number = 0;

  showFriendsOn: boolean = false;

  allPicsArr: any[] = [];
  profilesOfFriendsArr: UserClass[] = [];

  tableDataSource!: MatTableDataSource<UserClass>;
  columnsToDisplay: string[] = ['name', 'profilePicture', 'birthDate'];

  constructor(
    private actRoute: ActivatedRoute,
    private base: BaseService,

    // paginator opciói
    private pag: MatPaginatorIntl
  ) {}

  showPicBig(i: number) {
    // nagykép beállítása
    this.viewIndex = this.actIndex + i;
  }

  showFriends() {
    // paginator beállítása, promise lefuttatása
    if (this.profilesOfFriendsArr.length > 0) {
      this.waitUntilPaginatorIsSet().then(
        (pag: any) => (this.tableDataSource.paginator = pag)
      );
    }
  }

  waitUntilPaginatorIsSet() {
    // promise a paginator működéséhez
    return new Promise((res, rej) => {
      const interval = setInterval(() => {
        if (this.paginator !== undefined) {
          clearInterval(interval);
          res(this.paginator);
        }
      });
    });
  }

  left() {
    // balra lépegetés képeknél
    if (this.actIndex > 0) this.actIndex--;
    this.friendProfile.pictures = this.allPicsArr.slice(
      this.actIndex,
      this.actIndex + 3
    );
  }

  right() {
    // jobbra lépegetés képeknél
    if (this.actIndex + 4 <= this.allPicsArr.length) this.actIndex++;
    this.friendProfile.pictures = this.allPicsArr.slice(
      this.actIndex,
      this.actIndex + 3
    );
  }

  ngOnInit(): void {
        // Click eseményre barát uid átküldve út paraméterként, feliratkozva rá
    // BehaviorSubject küldi el a chat komponensből a barát profilját
    this.actRoute.params.subscribe((uid) => {
      this.friendProfileSubscription = this.base.friendProfileSubject.subscribe(
        (frObj) => {
          if (frObj.uid) {
            this.friendProfile = frObj;

            // A barát képobjektumának átalakítása iterálhatóvá, utána mapelem
            // 2 tömbben elmentem a képeket a slice metódus alkalmazásához
            // A this.allPicsArr-ben megmaradnak az eredeti képek
            if (this.friendProfile.pictures) {
              const picturesArr = Object.values(this.friendProfile.pictures);
              const picUrlsArr = picturesArr.map((pic: any) => pic.url);
              this.friendProfile.pictures = picUrlsArr;
              this.allPicsArr = picUrlsArr;
              this.friendProfile.pictures = this.friendProfile.pictures.slice(
                0,
                3
              );
            }

            // Barátok listája összegyűjtése és tömbbe helyezése
            this.userProfilesSubscription =
              this.base.userProfilesSubject.subscribe((uProfs: UserClass[]) => {
                const friendsArr = Object.values(
                  this.friendProfile.friends as any
                ).map((friend: any) => friend.friendId);
                this.profilesOfFriendsArr = uProfs.filter((uP: UserClass) => {
                  if (uP.age < 1 || !uP.age) {
                    uP.age = 2024 - +uP.birthDate.substring(0, 4);
                  }
                  return friendsArr.includes(uP.uid);
                });

                // paginator címke
                this.pag.itemsPerPageLabel =
                  'Ismerősők megjelenítése egyszerre:';

                // matTable adatforrásának beállítása
                this.tableDataSource = new MatTableDataSource<UserClass>(
                  this.profilesOfFriendsArr
                );
              });
          }
        }
      );
    });
  }

  ngAfterViewInit(): void {

  }

  ngOnDestroy(): void {
    // Subject leiratkozások
    if (this.userProfilesSubscription) {
      this.userProfilesSubscription.unsubscribe();
    }
    if (this.friendProfileSubscription) {
      this.friendProfileSubscription.unsubscribe();
    }
  }
}
