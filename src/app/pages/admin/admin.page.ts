import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonAvatar,
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTextarea,
  IonThumbnail,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, cloudDownload, trash } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { Movie, UserProfile } from '../../core/models';
import { MovieService } from '../../core/movie.service';
import { Toast } from '../../core/toast.service';
import { UserService } from '../../core/user.service';

@Component({
  selector: 'app-admin',
  templateUrl: 'admin.page.html',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon,
    IonSpinner,
    IonThumbnail,
    IonAvatar,
    IonToggle,
    IonBadge,
    IonNote,
  ],
})
export class AdminPage implements OnDestroy {
  private auth = inject(AuthService);
  readonly movieService = inject(MovieService);
  private userService = inject(UserService);
  private toast = inject(Toast);
  private alertCtrl = inject(AlertController);

  readonly tab = signal<'movies' | 'users'>('movies');
  readonly saving = signal(false);
  readonly lookingUp = signal(false);
  readonly users = signal<UserProfile[]>([]);
  readonly myUid = computed(() => this.auth.profile()?.uid);

  title = '';
  overview = '';
  posterUrl = '';
  releaseDate = '';

  private unsubscribe = this.userService.watchAll((users) =>
    this.users.set([...users].sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`))),
  );

  constructor() {
    addIcons({ add, cloudDownload, trash });
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  async fillFromTmdb(): Promise<void> {
    if (!this.title.trim()) {
      return void this.toast.show("Saisissez d'abord un titre", 'danger');
    }
    this.lookingUp.set(true);
    try {
      const found = await this.movieService.tmdbLookup(this.title.trim());
      if (!found) {
        return void (await this.toast.show('Aucun film trouvé sur TMDB', 'medium'));
      }
      this.title = found.title;
      this.overview = found.overview;
      this.posterUrl = found.posterUrl ?? '';
      this.releaseDate = found.releaseDate;
    } catch (e) {
      await this.toast.error(e);
    } finally {
      // Le changement du signal rafraîchit aussi les champs ngModel (mode zoneless).
      this.lookingUp.set(false);
    }
  }

  async addMovie(): Promise<void> {
    if (!this.title.trim()) {
      return void this.toast.show('Le titre est obligatoire', 'danger');
    }
    if (this.posterUrl && !/^https?:\/\//.test(this.posterUrl.trim())) {
      return void this.toast.show("L'URL de l'affiche doit commencer par http(s)://", 'danger');
    }
    this.saving.set(true);
    try {
      await this.movieService.addMovie({
        title: this.title.trim(),
        overview: this.overview.trim(),
        posterUrl: this.posterUrl.trim() || null,
        releaseDate: this.releaseDate,
      });
      this.title = this.overview = this.posterUrl = this.releaseDate = '';
      await this.toast.show('Film ajouté à la base', 'success');
    } catch (e) {
      await this.toast.error(e);
    } finally {
      this.saving.set(false);
    }
  }

  async deleteMovie(movie: Movie): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Supprimer ce film ?',
      message: movie.title,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: () => {
            this.movieService.deleteMovie(movie).catch((e) => this.toast.error(e));
          },
        },
      ],
    });
    await alert.present();
  }

  async setActive(user: UserProfile, active: boolean): Promise<void> {
    try {
      await this.userService.setDisabled(user.uid, !active);
      await this.toast.show(
        `${user.prenom} ${user.nom} ${active ? 'réactivé' : 'désactivé'}`,
        active ? 'success' : 'medium',
      );
    } catch (e) {
      await this.toast.error(e);
    }
  }
}
