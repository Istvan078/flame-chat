import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/compat/database';
import { ActivatedRoute, Router } from '@angular/router';

import { Recipe } from 'src/app/models/recipe.model';
import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss']
})
export class RecipeListComponent implements OnInit{
  
  recipes: Recipe[] = []

  constructor(private baseService: BaseService,
    private router: Router,
    private route: ActivatedRoute) {
  }
  ngOnInit(): void {
    this.baseService.getRecipes().subscribe(
      (recipes: Recipe[]) => {
        console.log(recipes)
        this.recipes = recipes
      }
    )
  }

  recipeDetail(key:string) {
    this.router.navigate([key], {relativeTo: this.route})
  }

}
