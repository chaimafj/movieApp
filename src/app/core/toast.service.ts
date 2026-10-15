import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class Toast {
  private toastCtrl = inject(ToastController);

  async show(message: string, color: 'success' | 'danger' | 'medium' = 'medium'): Promise<void> {
    const t = await this.toastCtrl.create({ message, color, duration: 2500, position: 'bottom' });
    await t.present();
  }

  /** Traduit les erreurs Firebase les plus courantes en français. */
  error(e: unknown): Promise<void> {
    const code = (e as { code?: string })?.code ?? '';
    const messages: Record<string, string> = {
      'auth/invalid-credential': 'Email ou mot de passe incorrect.',
      'auth/invalid-email': 'Adresse email invalide.',
      'auth/email-already-in-use': 'Cet email est déjà utilisé.',
      'auth/weak-password': 'Mot de passe trop faible (6 caractères minimum).',
      'auth/network-request-failed': 'Problème de connexion réseau.',
      'auth/configuration-not-found':
        "Firebase Authentication n'est pas activé (console > Authentication > Commencer > E-mail/Mot de passe).",
      'auth/operation-not-allowed': "La connexion E-mail/Mot de passe n'est pas activée dans Firebase.",
      'permission-denied': 'Action non autorisée.',
    };
    return this.show(messages[code] ?? (e as Error)?.message ?? 'Erreur inconnue', 'danger');
  }
}
