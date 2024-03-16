import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { Notes } from 'src/app/models/notes.model';
import { AuthService } from 'src/app/services/auth.service';

import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss'],
})
export class NotesComponent implements OnInit, OnDestroy {
  isOpen = false;
  isSuperAdmin: boolean = false;
  subscription: Subscription = new Subscription;
  isUpdating = false;
  isLoading: boolean | undefined;
  inputClass: boolean =false;
  notes: Notes[] = [];
  title: string = '';
  body: string = '';
  timeStamp: Date = new Date();
  key: any;
  buttonText: string ='Jegyzet létrehozása';
  searchWord:any = "";
  errorm = null;
  clearError = false;

  constructor(private baseService: BaseService,
    private authService: AuthService) {
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.baseService.getNotes().subscribe({
      next: (notes) => {
        this.isLoading = false
        this.notes = notes;
    this.subscription =    this.authService.isSuperAdmin.subscribe(
          (value) => this.isSuperAdmin = value
        )
      },
      error: (err) => {
        this.errorm = err.message;
      },
    });

  }

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
    const body: Partial<Notes> = {
      title: this.title,
      body: this.body,
      timeStamp: this.timeStamp.getTime().toString(),
      counter: 0
    };
    this.baseService.createNote(body);
    this.title = '';
    this.body = '';
    this.isOpen = false;
  }

  deleteNote(note: Notes) {
    this.baseService.deleteNote(note);
  }

  deleteAllNotes() {
    this.baseService.deleteAllNotes().subscribe((response) => {
      this.notes = []
    })
  }

  updateNote() {
    const body = {
      title: this.title,
      body: this.body,
      timeStamp: this.timeStamp.getTime().toString(),
      counter: 1
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

  onHandleError() {
    this.errorm = null;
    this.clearError = true;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }
}
