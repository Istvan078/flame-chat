import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialogModule } from "@angular/material/dialog";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { FilterPipe } from "src/app/pipes/filter.pipe";
import { ShortenPipe } from "src/app/pipes/shorten.pipe";
import { SortPipe } from "src/app/pipes/sort.pipe";

@NgModule({
    declarations:[  
        SortPipe,
        ShortenPipe,
        FilterPipe

    ],
    imports: [
        NgbModule,
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        MatFormFieldModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatInputModule,
        MatTooltipModule,
        MatSelectModule,
        MatTableModule,
        MatProgressBarModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatExpansionModule,
        MatDialogModule
    ],
    exports: [
        NgbModule,
        FormsModule,
        ReactiveFormsModule,
        FilterPipe,
        ShortenPipe,
        SortPipe,
        CommonModule,
        MatFormFieldModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatInputModule,
        MatTooltipModule,
        MatSelectModule,
        MatTableModule,
        MatProgressBarModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatExpansionModule,
        MatDialogModule
    ]
})

export class SharedModule{}