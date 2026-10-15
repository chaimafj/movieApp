export type MovieSource = 'tmdb' | 'custom';

export interface Movie {
  /** Identifiant global : "tmdb_<id>" ou "custom_<docId>". */
  id: string;
  title: string;
  overview: string;
  posterUrl: string | null;
  releaseDate: string;
  rating?: number;
  source: MovieSource;
}

/** Version réduite d'un film, stockée dans la playlist de l'utilisateur. */
export interface FavoriteMovie {
  id: string;
  title: string;
  posterUrl: string | null;
  releaseDate: string;
}

export type Role = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  nom: string;
  prenom: string;
  age: number;
  /** Photo prise par la caméra, compressée en Data URL JPEG. */
  photo: string;
  role: Role;
  disabled: boolean;
  favorites: FavoriteMovie[];
  createdAt: number;
}

export interface UserMatch {
  user: UserProfile;
  /** Taux de correspondance entre 0 et 1. */
  score: number;
  common: FavoriteMovie[];
}
