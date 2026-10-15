import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonAvatar,
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera, logOut } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { takePhoto } from '../../core/photo';
import { Toast } from '../../core/toast.service';

@Component({
  selector: 'app-profile',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mon profil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (auth.profile(); as p) {
        <div class="photo-picker">
          <ion-avatar class="big-avatar">
            @if (p.photo) { <img [src]="p.photo" alt="Photo de profil" /> }
          </ion-avatar>
          <ion-button fill="outline" size="small" (click)="changePhoto()">
            <ion-icon slot="start" name="camera"></ion-icon> Changer la photo
          </ion-button>
        </div>
        <ion-list>
          <ion-item><ion-label>Nom</ion-label><ion-label slot="end">{{ p.nom }}</ion-label></ion-item>
          <ion-item><ion-label>Prénom</ion-label><ion-label slot="end">{{ p.prenom }}</ion-label></ion-item>
          <ion-item><ion-label>Âge</ion-label><ion-label slot="end">{{ p.age }} ans</ion-label></ion-item>
          <ion-item><ion-label>Email</ion-label><ion-label slot="end">{{ p.email }}</ion-label></ion-item>
          <ion-item><ion-label>Films favoris</ion-label><ion-badge slot="end">{{ p.favorites.length }}</ion-badge></ion-item>
          <ion-item>
            <ion-label>Rôle</ion-label>
            <ion-badge slot="end" [color]="p.role === 'admin' ? 'tertiary' : 'medium'">
              {{ p.role === 'admin' ? 'Administrateur' : 'Utilisateur' }}
            </ion-badge>
          </ion-item>
        </ion-list>
        <ion-button expand="block" color="danger" class="ion-margin-top" (click)="logout()">
          <ion-icon slot="start" name="log-out"></ion-icon> Se déconnecter
        </ion-button>
      }
    </ion-content>
  `,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonAvatar, IonButton, IonIcon, IonList, IonItem, IonLabel, IonBadge],
})
export class ProfilePage {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(Toast);

  constructor() {
    addIcons({ camera, logOut });
  }

  async changePhoto(): Promise<void> {
    try {
      await this.auth.updatePhoto(await takePhoto());
      await this.toast.show('Photo mise à jour', 'success');
    } catch (e) {
      if (!String((e as Error)?.message).toLowerCase().includes('cancel')) {
        await this.toast.error(e);
      }
    }
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
