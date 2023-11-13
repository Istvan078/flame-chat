import { Injectable } from '@angular/core';

import { AngularFireDatabase, AngularFireList } from "@angular/fire/compat/database";
import { Notes } from '../models/notes';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BaseService {

  refNotes: AngularFireList<Notes>

  constructor(
    private realTimeDatabase: AngularFireDatabase
  ) { 
    this.refNotes = realTimeDatabase.list('/notes');
  }

  getNotes() {
    return this.refNotes.snapshotChanges().pipe(
      map((changes) => changes.map(
        (c) => ({key: c.payload.key, ...c.payload.val()})
      ))
    )}

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

}
