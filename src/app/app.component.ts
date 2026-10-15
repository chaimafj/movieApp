import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // Si l'utilisateur est déconnecté (ou désactivé par l'admin), retour à l'écran de connexion.
    effect(() => {
      if (!this.auth.firebaseUser() && this.router.url.startsWith('/tabs')) {
        void this.router.navigateByUrl('/login', { replaceUrl: true });
      }
    });
  }
}
