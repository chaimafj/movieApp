import { Injectable, signal } from '@angular/core';
import {
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { FavoriteMovie, Movie, UserProfile } from './models';

export interface RegisterData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  age: number;
  photo: string;
}

export class DisabledAccountError extends Error {
  constructor() {
    super("Ce compte a été désactivé par l'administrateur.");
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly firebaseUser = signal<User | null>(null);
  readonly profile = signal<UserProfile | null>(null);
  /** Résolue dès que l'état d'authentification initial (et le profil) est connu. */
  readonly ready: Promise<void>;

  private unsubscribeProfile?: () => void;
  private disabledUid: string | null = null;

  constructor() {
    this.ready = new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        this.firebaseUser.set(user);
        this.unsubscribeProfile?.();
        this.unsubscribeProfile = undefined;
        if (!user) {
          this.profile.set(null);
          resolve();
          return;
        }
        this.unsubscribeProfile = onSnapshot(
          doc(db, 'users', user.uid),
          (snap) => {
            const profile = snap.exists() ? ({ ...snap.data(), uid: snap.id } as UserProfile) : null;
            if (profile?.disabled) {
              // Désactivé pendant la session : on déconnecte immédiatement.
              this.disabledUid = user.uid;
              void this.logout();
            } else if (profile || !this.profile()) {
              this.profile.set(profile);
            }
            resolve();
          },
          () => resolve(),
        );
      });
    });
  }

  isAdmin(): boolean {
    return this.profile()?.role === 'admin';
  }

  async login(email: string, password: string): Promise<void> {
    this.disabledUid = null;
    const cred = await signInWithEmailAndPassword(auth, email, password);
    let snap;
    try {
      snap = await getDoc(doc(db, 'users', cred.user.uid));
    } catch (e) {
      // L'écouteur de profil a pu détecter le compte désactivé et déconnecter avant cette lecture.
      if (this.disabledUid === cred.user.uid) {
        throw new DisabledAccountError();
      }
      throw e;
    }
    if (!snap.exists()) {
      await signOut(auth);
      throw new Error('Profil introuvable : terminez votre inscription via « Créer un compte » avec le même email.');
    }
    const profile = { ...snap.data(), uid: snap.id } as UserProfile;
    if (profile.disabled) {
      await signOut(auth);
      throw new DisabledAccountError();
    }
    this.profile.set(profile);
  }

  async register(data: RegisterData): Promise<void> {
    let cred: UserCredential;
    let isNewAccount = true;
    try {
      cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    } catch (e) {
      if ((e as { code?: string }).code !== 'auth/email-already-in-use') {
        throw e;
      }
      // Compte Auth existant sans profil (inscription précédente interrompue) : on complète le profil.
      cred = await signInWithEmailAndPassword(auth, data.email, data.password).catch(() => {
        throw e;
      });
      isNewAccount = false;
      if ((await getDoc(doc(db, 'users', cred.user.uid))).exists()) {
        await signOut(auth);
        throw e;
      }
    }
    const profile: UserProfile = {
      uid: cred.user.uid,
      email: data.email,
      nom: data.nom,
      prenom: data.prenom,
      age: data.age,
      photo: data.photo,
      role: 'user',
      disabled: false,
      favorites: [],
      createdAt: Date.now(),
    };
    const { uid, ...docData } = profile;
    try {
      await setDoc(doc(db, 'users', uid), docData);
    } catch (e) {
      // Évite de laisser un compte Auth sans profil Firestore.
      await (isNewAccount ? deleteUser(cred.user) : signOut(auth)).catch(() => signOut(auth));
      throw e;
    }
    this.profile.set(profile);
  }

  async logout(): Promise<void> {
    this.unsubscribeProfile?.();
    this.unsubscribeProfile = undefined;
    this.profile.set(null);
    await signOut(auth);
  }

  isFavorite(movieId: string): boolean {
    return !!this.profile()?.favorites.some((f) => f.id === movieId);
  }

  async toggleFavorite(movie: Movie | FavoriteMovie): Promise<boolean> {
    const profile = this.profile();
    if (!profile) {
      throw new Error('Non connecté');
    }
    const exists = profile.favorites.some((f) => f.id === movie.id);
    const favorites: FavoriteMovie[] = exists
      ? profile.favorites.filter((f) => f.id !== movie.id)
      : [
          ...profile.favorites,
          { id: movie.id, title: movie.title, posterUrl: movie.posterUrl, releaseDate: movie.releaseDate },
        ];
    this.profile.set({ ...profile, favorites });
    try {
      await updateDoc(doc(db, 'users', profile.uid), { favorites });
    } catch (e) {
      this.profile.set(profile);
      throw e;
    }
    return !exists;
  }

  async updatePhoto(photo: string): Promise<void> {
    const profile = this.profile();
    if (!profile) {
      return;
    }
    await updateDoc(doc(db, 'users', profile.uid), { photo });
  }
}
