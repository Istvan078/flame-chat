import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { RecipesComponent } from "./recipes.component";
import { RecipeEditComponent } from "./recipe-edit/recipe-edit.component";
import { RecipeDetailComponent } from "./recipe-detail/recipe-detail.component";

const routes: Routes = [
    {path: "", component: RecipesComponent, children: [
          {path: "create", component: RecipeEditComponent},
          {path: "detail", component: RecipeDetailComponent},
          {path: "edit", component: RecipeEditComponent}
        ]},
        {path: "**", redirectTo: ""},
]

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [
        RouterModule
    ]
})

export class RecipesRoutingModule {

}