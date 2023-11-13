import { Component, OnInit } from '@angular/core';

import { Notes } from 'src/app/models/notes';

import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss'],
})
export class NotesComponent implements OnInit {
  isOpen = false;
  isUpdating = false;
  inputClass: boolean =false;
  notes: Notes[] = [];
  title: string = '';
  body: string = '';
  time: string= '';
  key: any;
  buttonText: string ='Jegyzet létrehozása';
  searchWord:any = "";

  constructor(private baseService: BaseService) {
    console.log(this.key);
  }

  ngOnInit(): void {
    this.baseService.getNotes().subscribe({
      next: (notes) => {
        this.notes = notes;
      },
      error: (err) => {
        console.log(err);
      },
    });


    // setInterval(()=>this.date(),1000)
  }
  // date(){
  // const date = new Date().toDateString();
  // const hours = new Date().getHours().toString();
  // const minutes = new Date().getMinutes().toString();
  // const seconds = new Date().getSeconds().toString();
  // const time = date + " - " + hours + ":" + minutes + ":" + seconds;
  // this.time = time;}

  createUpdateControl() {
    if (this.key == undefined) {
      this.createNote();
    } else {
      this.updateNote();
      this.key = undefined;
      this.buttonText = "Jegyzet létrehozása"
    }
  }

  createNote() {
    const body = {
      title: this.title,
      body: this.body,
    };
    this.baseService.createNote(body);
    this.title = '';
    this.body = '';
    this.isOpen = false;
  }

  deleteNote(note: Notes) {
    this.baseService.deleteNote(note);
  }

  updateNote() {
    const body = {
      title: this.title,
      body: this.body,
    };
    this.baseService.updateNote(this.key, body);
    this.isUpdating = false;
    this.isOpen = false;
  }

  putDataToInput(note: any) {
    this.title = note.title;
    this.body = note.body;
    this.isUpdating = true;
    this.key = note.key;
    this.isOpen = true;
    this.buttonText = "Módosítás"
    
  }
}
