import { Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { db } from './firebase';
import { Movie } from './models';

const TMDB_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date?: string;
  vote_average?: number;
}

interface TmdbPage {
  page: number;
  total_pages: number;
  results: TmdbMovie[];
}

export interface MoviePage {
  movies: Movie[];
  hasMore: boolean;
}

export type NewMovie = Pick<Movie, 'title' | 'overview' | 'posterUrl' | 'releaseDate'>;

@Injectable({ providedIn: 'root' })
export class MovieService {
  readonly tmdbEnabled = !environment.tmdbApiKey.startsWith('VOTRE_');
  /** Films ajoutés par l'administrateur (collection Firestore "movies"). */
  readonly customMovies = signal<Movie[]>([]);

  private unsubscribe?: () => void;

  /** Écoute en temps réel la collection des films ajoutés par l'admin. */
  watchCustomMovies(): void {
    if (this.unsubscribe) {
      return;
    }
    this.unsubscribe = onSnapshot(
      query(collection(db, 'movies'), orderBy('createdAt', 'desc')),
      (snap) =>
        this.customMovies.set(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: `custom_${d.id}`,
              title: data['title'],
              overview: data['overview'] ?? '',
              posterUrl: data['posterUrl'] || null,
              releaseDate: data['releaseDate'] ?? '',
              source: 'custom',
            } satisfies Movie;
          }),
        ),
      (err) => console.error('Lecture des films impossible', err),
    );
  }

  stopWatching(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.customMovies.set([]);
  }

  /** Films populaires TMDB, ou résultats de recherche si `search` est renseigné. */
  async tmdbMovies(page: number, search = ''): Promise<MoviePage> {
    if (!this.tmdbEnabled) {
      return { movies: [], hasMore: false };
    }
    const params = new URLSearchParams({
      api_key: environment.tmdbApiKey,
      language: 'fr-FR',
      page: String(page),
    });
    let path = '/movie/popular';
    if (search.trim()) {
      path = '/search/movie';
      params.set('query', search.trim());
    }
    const res = await fetch(`${TMDB_URL}${path}?${params}`);
    if (!res.ok) {
      throw new Error(`TMDB : erreur ${res.status}`);
    }
    const data = (await res.json()) as TmdbPage;
    return {
      movies: data.results.map((m) => ({
        id: `tmdb_${m.id}`,
        title: m.title,
        overview: m.overview,
        posterUrl: m.poster_path ? TMDB_IMG + m.poster_path : null,
        releaseDate: m.release_date ?? '',
        rating: m.vote_average,
        source: 'tmdb',
      })),
      hasMore: data.page < data.total_pages,
    };
  }

  /** Premier résultat TMDB pour un titre (pré-remplissage du formulaire admin). */
  async tmdbLookup(title: string): Promise<NewMovie | null> {
    const { movies } = await this.tmdbMovies(1, title);
    const m = movies[0];
    return m ? { title: m.title, overview: m.overview, posterUrl: m.posterUrl, releaseDate: m.releaseDate } : null;
  }

  async addMovie(movie: NewMovie): Promise<void> {
    await addDoc(collection(db, 'movies'), { ...movie, createdAt: Date.now() });
  }

  async deleteMovie(movie: Movie): Promise<void> {
    await deleteDoc(doc(db, 'movies', movie.id.replace(/^custom_/, '')));
  }
}
