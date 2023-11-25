import { Injectable, OnInit } from '@angular/core';

import { AngularFireDatabase, AngularFireList } from "@angular/fire/compat/database";
import { Notes } from '../models/notes';
import { Observable, Subject, catchError, map, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Recipe } from '../models/recipe.model';
import { AuthService } from './auth.service';

interface Note {
  body: string
  counter: number
  timeStamp: string
  title: string
  id?:string
}

@Injectable({
  providedIn: 'root'
})
export class BaseService implements OnInit{

  user:any;
  refNotes: AngularFireList<Notes>
  refRecipeList!: AngularFireList<Recipe>;
  apiUrl = "https://us-central1-project0781.cloudfunctions.net/api/"


  constructor(
    private realTimeDatabase: AngularFireDatabase,
    private http: HttpClient,
    private authService: AuthService
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
      )),
      catchError(errorRes => {
        return throwError(errorRes);
      })
    )

  }

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

  deleteAllNotes() {
  return this.http.delete("https://project0781-default-rtdb.europe-west1.firebasedatabase.app/notes.json",
  )
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

  // fetchNotes() {
  //   this.http.get<{[key:string]: Note}>("https://project0781-default-rtdb.europe-west1.firebasedatabase.app/notes.json")
  //   .pipe(map((responseData) => {
  //     const notesArray: Note[] = [];
      
  //     for(const key in responseData) {
  //       if(responseData.hasOwnProperty(key)){
  //       notesArray.push({...responseData[key], id:key})
  //     }}
  //     return notesArray
  //   })).subscribe((responseData) => {
  //     console.log(responseData)
  //   })
  // }

}
