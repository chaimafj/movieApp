import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonText,
  IonThumbnail,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trash } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { FavoriteMovie } from '../../core/models';
import { Toast } from '../../core/toast.service';

@Component({
  selector: 'app-playlist',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Ma playlist</ion-title>
        <ion-buttons slot="end">
          <ion-badge color="light" class="ion-margin-end">{{ favorites().length }}</ion-badge>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (!favorites().length) {
        <div class="ion-padding ion-text-center">
          <ion-text color="medium"><p>Votre playlist est vide.</p></ion-text>
          <ion-button routerLink="/tabs/movies">Parcourir les films</ion-button>
        </div>
      } @else {
        <ion-list>
          @for (movie of favorites(); track movie.id) {
            <ion-item-sliding>
              <ion-item>
                <ion-thumbnail slot="start">
                  @if (movie.posterUrl) {
                    <img [src]="movie.posterUrl" [alt]="movie.title" />
                  } @else {
                    <div class="poster-placeholder">🎬</div>
                  }
                </ion-thumbnail>
                <ion-label>
                  <h2>{{ movie.title }}</h2>
                  <p>{{ movie.releaseDate ? movie.releaseDate.slice(0, 4) : '—' }}</p>
                </ion-label>
                <ion-button slot="end" fill="clear" color="danger" (click)="remove(movie)" aria-label="Retirer">
                  <ion-icon slot="icon-only" name="trash"></ion-icon>
                </ion-button>
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option color="danger" (click)="remove(movie)">Retirer</ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          }
        </ion-list>
      }
    </ion-content>
  `,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBadge,
    IonContent,
    IonText,
    IonButton,
    IonList,
    IonItemSliding,
    IonItem,
    IonThumbnail,
    IonLabel,
    IonIcon,
    IonItemOptions,
    IonItemOption,
  ],
})
export class PlaylistPage {
  private auth = inject(AuthService);
  private toast = inject(Toast);
  readonly favorites = computed(() => this.auth.profile()?.favorites ?? []);

  constructor() {
    addIcons({ trash });
  }

  async remove(movie: FavoriteMovie): Promise<void> {
    try {
      await this.auth.toggleFavorite(movie);
      await this.toast.show(`« ${movie.title} » retiré`, 'success');
    } catch (e) {
      await this.toast.error(e);
    }
  }
}
