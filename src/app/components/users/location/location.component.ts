import { AfterViewInit, Component, input } from '@angular/core';
import * as L from 'leaflet';
import { UserClass } from 'src/app/models/user.model';
@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrl: './location.component.scss',
})
export class LocationComponent implements AfterViewInit {
  curUserPosition!: string;
  userPositions: any[] = [];
  userProfile = input<UserClass>();
  userProfiles = input<UserClass[]>();
  selectedUser = input<any>();
  previousUser: any[] = [];
  map!: L.Map;

  constructor() {}

  ngAfterViewInit(): void {
    const int = setInterval(() => {
      if (
        this.selectedUser().uid &&
        !this.previousUser?.includes(this.selectedUser().uid)
      ) {
        this.previousUser.push(this.selectedUser().uid);
        if (this.previousUser.length < 2) {
          this.getLocation();
          console.log('LEFUTOTT');
        }
      }
    }, 1000);
    const int2 = setInterval(() => {
      if (this.previousUser?.length > 1) {
        this.clearMap();
        this.previousUser.splice(0, 1);
        this.getLocation();
      }
    }, 1000);
  }
  getLocation() {
    let curUsPos: any = this.selectedUser()?.curPosition;
    curUsPos = curUsPos?.split(',');
    console.log(curUsPos);
    this.map = L.map('map').setView([curUsPos[0], curUsPos[1]], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
      this.map
    );
    const selectedUser = this.userProfiles()?.find(
      uP => uP.uid === this.selectedUser().uid
    );
    selectedUser?.positions?.map(pos => {
      const strTime = new Date(pos.time).toLocaleString();
      const usPos: any[] = pos.position.split(',');
      L.marker([usPos[0], usPos[1]])
        .bindPopup('Látogatási idő: ' + strTime)
        .addTo(this.map);
      console.log(usPos);
    });
    // L.marker([curUsPos[0], curUsPos[1]]).addTo(this.map);
  }

  clearMap() {
    this.map.remove();
  }

  // getUserPositions() {
  //   if (this.userProfile()?.uid) console.log(this.userProfile());
  // }
  // getSelectedUser() {
  //   console.log(this.selectedUser());
  // }
}
