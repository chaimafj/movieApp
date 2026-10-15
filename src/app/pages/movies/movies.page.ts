import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  InfiniteScrollCustomEvent,
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSearchbar,
  IonSpinner,
  IonThumbnail,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { heart, heartOutline, star } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { Movie } from '../../core/models';
import { MovieService } from '../../core/movie.service';
import { Toast } from '../../core/toast.service';

@Component({
  selector: 'app-movies',
  templateUrl: 'movies.page.html',
  imports: [
    NgTemplateOutlet,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonList,
    IonListHeader,
    IonItem,
    IonThumbnail,
    IonLabel,
    IonNote,
    IonButton,
    IonIcon,
    IonBadge,
    IonSpinner,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
  ],
})
export class MoviesPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly movieService = inject(MovieService);
  private toast = inject(Toast);

  readonly search = signal('');
  readonly tmdbMovies = signal<Movie[]>([]);
  readonly loading = signal(false);
  readonly hasMore = signal(false);
  private page = 1;

  readonly customMovies = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.movieService.customMovies().filter((m) => !term || m.title.toLowerCase().includes(term));
  });

  readonly favoriteIds = computed(() => new Set(this.auth.profile()?.favorites.map((f) => f.id) ?? []));

  constructor() {
    addIcons({ heart, heartOutline, star });
  }

  ngOnInit(): void {
    void this.reload();
  }

  onSearch(value: string | null | undefined): void {
    this.search.set(value ?? '');
    void this.reload();
  }

  async reload(): Promise<void> {
    this.page = 1;
    this.tmdbMovies.set([]);
    this.loading.set(true);
    await this.loadPage();
    this.loading.set(false);
  }

  async loadMore(event: InfiniteScrollCustomEvent): Promise<void> {
    this.page++;
    await this.loadPage();
    await event.target.complete();
  }

  private async loadPage(): Promise<void> {
    const term = this.search();
    try {
      const result = await this.movieService.tmdbMovies(this.page, term);
      if (term !== this.search()) {
        return; // une recherche plus récente a été lancée entre-temps
      }
      const known = new Set(this.tmdbMovies().map((m) => m.id));
      this.tmdbMovies.update((list) => [...list, ...result.movies.filter((m) => !known.has(m.id))]);
      this.hasMore.set(result.hasMore);
    } catch (e) {
      this.hasMore.set(false);
      await this.toast.error(e);
    }
  }

  async toggle(movie: Movie): Promise<void> {
    try {
      const added = await this.auth.toggleFavorite(movie);
      await this.toast.show(added ? 'Ajouté à votre playlist' : 'Retiré de votre playlist', 'success');
    } catch (e) {
      await this.toast.error(e);
    }
  }

  year(date: string): string {
    return date ? date.slice(0, 4) : '—';
  }
}
