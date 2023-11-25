import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Recipe } from 'src/app/models/recipe.model';
import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-recipe-edit',
  templateUrl: './recipe-edit.component.html',
  styleUrls: ['./recipe-edit.component.scss'],
})
export class RecipeEditComponent implements OnInit {
  @ViewChild('f') formData!: NgForm;
  key: string = '';
  defaultDifficulty: string = 'Kozepes';
  submitButtonValue: string = 'Recept hozzaadasa';
  recipe: Recipe = {
    name: '',
    ingredients: '',
    howToMake: '',
    timeToMake: 0,
    portion: 0,
    difficulty: '',
    //  photo: ''
  };


  recipeForm!: FormGroup;

  constructor(
    private baseService: BaseService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.recipeForm = new FormGroup({
      name: new FormControl(null, Validators.required),
      ingredients: new FormControl(null, [
        Validators.required,
        Validators.minLength(5),
      ]),
      howToMake: new FormControl(null),
      timeToMake: new FormControl(null),
      portion: new FormControl(null),
      difficulty: new FormControl("kozepes"),
      //  photo: new FormControl()
    });
    this.route.queryParams.subscribe((params: Params) => {
      if (params['key']) {
        this.submitButtonValue = 'Recept modositasa';
      }
      console.log(params);
      this.key = params['key'];
      this.baseService.getRecipes().subscribe((recipes) => {
        for (let recipe of recipes) {
          if (recipe.key === this.key) {
            this.recipeForm.patchValue(recipe);
          }
        }
      });
    });
  }
  onSubmit() {
    this.recipe = this.recipeForm.value;

    if (this.submitButtonValue === 'Recept hozzaadasa') {
      this.baseService.addRecipe(this.recipe);
    } else {
      this.baseService.updateRecipe(this.key, this.recipe);
    }
    this.router.navigate(['recipes']);
  }
}
