import { Component, OnInit } from '@angular/core';
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
        this.recipes = recipes
      }
    )
  }

  // recipeDetail(key:string) {
  //   this.router.navigate([`../detail`], {relativeTo: this.route, queryParams: {key: key}, queryParamsHandling: 'preserve'})

  // }

}
