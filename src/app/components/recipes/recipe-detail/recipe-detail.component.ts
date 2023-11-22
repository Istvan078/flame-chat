import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-recipe-detail',
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.scss']
})
export class RecipeDetailComponent implements OnInit{
  constructor(private route: ActivatedRoute) {

  }

  ngOnInit(): void {
  const key =  this.route.snapshot.params["key"]
  console.log(key)
  }
}
