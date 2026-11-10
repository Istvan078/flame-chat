import { NgModule } from '@angular/core';

import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  languageOutline,
  globeOutline,
  logoGoogle,
} from 'ionicons/icons';

addIcons({
  personOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  languageOutline,
  globeOutline,
  logoGoogle,
});

@NgModule({
  imports: [
    IonContent,
    IonSpinner,
    IonTitle,
    IonIcon,
    IonCard,
    IonButton,
    IonCardHeader,
    IonCardContent,
    IonInput,
    IonSelectOption,
    IonSelect,
    IonItem,
    IonList,
    IonCardTitle,
    IonCardSubtitle,
  ],

  exports: [
    IonContent,
    IonSpinner,
    IonTitle,
    IonIcon,
    IonCard,
    IonButton,
    IonCardContent,
    IonCardHeader,
    IonInput,
    IonSelectOption,
    IonSelect,
    IonItem,
    IonList,
    IonCardTitle,
    IonCardSubtitle,
  ],
})
export class IonicModule {}
