import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import {
  IonAvatar,
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonChip,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonNote,
  IonProgressBar,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { findMatches, MATCH_THRESHOLD } from '../../core/matching';
import { UserProfile } from '../../core/models';
import { UserService } from '../../core/user.service';

@Component({
  selector: 'app-matching',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Matching</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-note style="display:block" class="ion-margin-bottom">
        Utilisateurs dont la playlist correspond à la vôtre à plus de {{ threshold | percent }}
        (films en commun / films distincts des deux playlists).
      </ion-note>

      @if (loading()) {
        <div class="ion-text-center"><ion-spinner></ion-spinner></div>
      } @else if (!myCount()) {
        <ion-text color="medium"><p>Ajoutez des films à votre playlist pour trouver des correspondances.</p></ion-text>
      } @else if (!matches().length) {
        <ion-text color="medium"><p>Aucun utilisateur ne dépasse encore {{ threshold | percent }} de correspondance.</p></ion-text>
      }

      @for (m of matches(); track m.user.uid) {
        <ion-card>
          <ion-item lines="none">
            <ion-avatar slot="start">
              @if (m.user.photo) { <img [src]="m.user.photo" alt="" /> }
            </ion-avatar>
            <ion-label>
              <h2>{{ m.user.prenom }} {{ m.user.nom }}</h2>
              <p>{{ m.user.age }} ans · {{ m.user.favorites.length }} films</p>
            </ion-label>
            <ion-badge slot="end" color="success">{{ m.score * 100 | number: '1.0-0' }} %</ion-badge>
          </ion-item>
          <ion-progress-bar [value]="m.score" color="success"></ion-progress-bar>
          <ion-card-header>
            <ion-card-subtitle>{{ m.common.length }} film(s) en commun</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            @for (f of m.common; track f.id) {
              <ion-chip>{{ f.title }}</ion-chip>
            }
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  imports: [
    PercentPipe,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonNote,
    IonSpinner,
    IonText,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonAvatar,
    IonLabel,
    IonBadge,
    IonProgressBar,
    IonChip,
  ],
})
export class MatchingPage implements OnDestroy {
  private auth = inject(AuthService);
  private userService = inject(UserService);

  readonly threshold = MATCH_THRESHOLD;
  readonly users = signal<UserProfile[]>([]);
  readonly loading = signal(true);
  readonly myCount = computed(() => this.auth.profile()?.favorites.length ?? 0);
  readonly matches = computed(() => {
    const me = this.auth.profile();
    return me ? findMatches(me, this.users()) : [];
  });

  private unsubscribe = this.userService.watchAll((users) => {
    this.users.set(users);
    this.loading.set(false);
  });

  ngOnDestroy(): void {
    this.unsubscribe();
  }
}
