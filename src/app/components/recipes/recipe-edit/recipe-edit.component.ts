import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { Recipe } from 'src/app/models/recipe.model';
import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-recipe-edit',
  templateUrl: './recipe-edit.component.html',
  styleUrls: ['./recipe-edit.component.scss']
})

export class RecipeEditComponent implements OnInit{
  @ViewChild('f') formData!: HTMLFormElement
  body!: Recipe
  key: string = ""
  defaultDifficulty: string = "Kozepes"
  recipe: Recipe = {
    name: '',
    ingredients: '',
    howToMake: '',
    timeToMake: 0,
    portion: 0,
    difficulty: '',
    photo: ''
  }

  recipeForm!: FormGroup;

  constructor(private baseService: BaseService,
    private route: ActivatedRoute) {}

    ngOnInit(): void {
      this.recipeForm = new FormGroup({
        key: new FormControl(null, Validators.required),
        name: new FormControl(null, Validators.required),
        ingredients: new FormControl(null, [Validators.required, Validators.minLength(5)]),
        howToMake: new FormControl(null),
        timeToMake: new FormControl(null),
        portion: new FormControl(null),
        difficulty: new FormControl("Kozepes"),
       //  photo: new FormControl()
     })
      this.route.params.subscribe((params: Params) => {
       
      //  this.baseService.updateRecipe(params["id"], body)
    
      console.log(params)
      this.key = params['key']
      this.baseService.getRecipes().subscribe((recipes) => {
        for(let recipe of recipes) {
          if(recipe.key === this.key) {
            this.recipeForm.setValue(recipe)
          }
        }
      //   console.log(recipes)
   //      if(recipes[1].key === this.key){
    //     this.recipeForm.setValue(recipes[1])
       })
      })
    }

  onEdit() {

  }
  onCreate() {
    

   this.body = this.recipeForm.value
    
  console.log(this.recipeForm)
  // this.baseService.addRecipe(this.body)
  }

}
