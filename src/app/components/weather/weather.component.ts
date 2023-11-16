import { Component } from '@angular/core';
import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.scss']
})
export class WeatherComponent {
  location: string = "";
  weather: any = {}

  constructor(private baseService: BaseService) {
  }

  getWeather(location:string) {
    this.baseService.getWeather(location).subscribe((weather) => {
      this.weather = weather
    })
  }
}
