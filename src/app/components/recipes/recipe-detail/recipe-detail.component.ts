import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Recipe } from 'src/app/models/recipe.model';
import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-recipe-detail',
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.scss'],
})
export class RecipeDetailComponent implements OnInit {
  key: string = ""
  recipe: Recipe = {
    name: '',
    ingredients: '',
    howToMake: '',
    timeToMake: 0,
    portion: 0,
    difficulty: '',
    //  photo: ''
  };

  constructor(private route: ActivatedRoute,
    private baseService: BaseService,
    private router: Router) {}

  ngOnInit(): void {
     this.route.queryParams.subscribe((params: Params) => {
      this.key = params["key"]
    
    this.baseService.getRecipes().subscribe((recipes: Recipe[]) => {
      for (let recipe of recipes) {
        if (recipe.key === this.key) {
          this.recipe = recipe
        };
      }
    })})
  }

  deleteRecipe() {
    this.baseService.deleteRecipe(this.key)
    this.router.navigate(["../"], {relativeTo: this.route})
  }

}
