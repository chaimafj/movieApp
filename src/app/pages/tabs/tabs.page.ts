import { Component, computed, inject, OnDestroy } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { film, heart, people, person, shieldCheckmark } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { MovieService } from '../../core/movie.service';

@Component({
  selector: 'app-tabs',
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="movies">
          <ion-icon name="film"></ion-icon>
          <ion-label>Films</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="playlist">
          <ion-icon name="heart"></ion-icon>
          <ion-label>Ma playlist</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="matching">
          <ion-icon name="people"></ion-icon>
          <ion-label>Matching</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile">
          <ion-icon name="person"></ion-icon>
          <ion-label>Profil</ion-label>
        </ion-tab-button>
        @if (isAdmin()) {
          <ion-tab-button tab="admin">
            <ion-icon name="shield-checkmark"></ion-icon>
            <ion-label>Admin</ion-label>
          </ion-tab-button>
        }
      </ion-tab-bar>
    </ion-tabs>
  `,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage implements OnDestroy {
  private auth = inject(AuthService);
  private movies = inject(MovieService);
  readonly isAdmin = computed(() => this.auth.profile()?.role === 'admin');

  constructor() {
    addIcons({ film, heart, people, person, shieldCheckmark });
    this.movies.watchCustomMovies();
  }

  ngOnDestroy(): void {
    this.movies.stopWatching();
  }
}
