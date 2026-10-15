import { Injectable } from '@angular/core';
import { collection, doc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from './models';

@Injectable({ providedIn: 'root' })
export class UserService {
  async getAll(): Promise<UserProfile[]> {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => ({ ...d.data(), uid: d.id }) as UserProfile);
  }

  /** Écoute en temps réel la liste des utilisateurs. Retourne la fonction de désabonnement. */
  watchAll(callback: (users: UserProfile[]) => void): () => void {
    return onSnapshot(collection(db, 'users'), (snap) =>
      callback(snap.docs.map((d) => ({ ...d.data(), uid: d.id }) as UserProfile)),
    );
  }

  /** Désactive / réactive un utilisateur (aucune suppression). */
  async setDisabled(uid: string, disabled: boolean): Promise<void> {
    await updateDoc(doc(db, 'users', uid), { disabled });
  }
}
