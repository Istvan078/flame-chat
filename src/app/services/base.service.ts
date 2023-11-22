import { Injectable, OnInit } from '@angular/core';

import { AngularFireDatabase, AngularFireList } from "@angular/fire/compat/database";
import { Notes } from '../models/notes';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Recipe } from '../models/recipe.model';

@Injectable({
  providedIn: 'root'
})
export class BaseService implements OnInit{

  refNotes: AngularFireList<Notes>
  refRecipeList!: AngularFireList<Recipe>;
  apiUrl = "https://us-central1-project0781.cloudfunctions.net/api/"

  constructor(
    private realTimeDatabase: AngularFireDatabase,
    private http: HttpClient
  ) { 
    this.refNotes = realTimeDatabase.list('/notes');
    this.refRecipeList = realTimeDatabase.list<Recipe>("/recipes")
  }

  ngOnInit(): void { 
      
    
  }

  getNotes() {
    return this.refNotes.snapshotChanges().pipe(
      map((changes) => changes.map(
        (c) => ({key: c.payload.key, ...c.payload.val()})
      ))
    )}

  getWeather(location: string) {
   return this.http.get(this.apiUrl + `weather?address=${location}`)
  }

  createNote(body: Partial<Notes>): void {
    // const nBody = {
    // title : body.title,
    // body : body.body}
      
  this.refNotes.push(body);
  }

  deleteNote(item: Pick<Notes, "key">): void {
    this.refNotes.remove(item.key)
  }

  updateNote(item:string, body: Pick<Notes, "title" | "body">): void  {
    this.refNotes.update(item, body)
  }

  getRecipe(key:string) {
    return  this.refRecipeList.snapshotChanges().pipe(map((changes) => 
    changes.map((c) => 
      ({key: key, 
        Recipe: c.payload.val()})
    )
  ))
  }

  getRecipes(): Observable<any> {
  return  this.refRecipeList.snapshotChanges().pipe(map((changes) => 
      changes.map((c) => 
        ({key: c.payload.key, ...c.payload.val()})
      )
    ))
  }

  addRecipe(body: Recipe) {
    this.refRecipeList.push(body)
  }

  updateRecipe(key: string, body:Recipe) {
    this.refRecipeList.update(key, body)
  }

  deleteRecipe(key:string) {
    this.refRecipeList.remove(key)
  }

}
