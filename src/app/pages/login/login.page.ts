import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonItem,
  IonList,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { isFirebaseConfigured } from '../../core/firebase';
import { Toast } from '../../core/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  imports: [
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonSpinner,
    IonText,
    IonNote,
  ],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(Toast);

  readonly configured = isFirebaseConfigured;
  email = '';
  password = '';
  readonly loading = signal(false);

  async login(): Promise<void> {
    if (!this.email || !this.password) {
      return void this.toast.show('Email et mot de passe requis', 'danger');
    }
    this.loading.set(true);
    try {
      await this.auth.login(this.email.trim(), this.password);
      await this.router.navigateByUrl('/tabs/movies', { replaceUrl: true });
    } catch (e) {
      await this.toast.error(e);
    } finally {
      this.loading.set(false);
    }
  }
}
