import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonItem,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { takePhoto } from '../../core/photo';
import { Toast } from '../../core/toast.service';

@Component({
  selector: 'app-register',
  templateUrl: 'register.page.html',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonIcon,
    IonAvatar,
    IonSpinner,
  ],
})
export class RegisterPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(Toast);

  nom = '';
  prenom = '';
  age: number | null = null;
  email = '';
  password = '';
  readonly photo = signal<string | null>(null);
  readonly loading = signal(false);

  constructor() {
    addIcons({ camera });
  }

  async capture(): Promise<void> {
    try {
      this.photo.set(await takePhoto());
    } catch (e) {
      if (!String((e as Error)?.message).toLowerCase().includes('cancel')) {
        await this.toast.error(e);
      }
    }
  }

  async register(): Promise<void> {
    const age = Number(this.age);
    if (!this.nom.trim() || !this.prenom.trim() || !this.email.trim() || !this.password) {
      return void this.toast.show('Tous les champs sont obligatoires', 'danger');
    }
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      return void this.toast.show('Âge invalide', 'danger');
    }
    const photo = this.photo();
    if (!photo) {
      return void this.toast.show('Prenez une photo avec la caméra', 'danger');
    }
    this.loading.set(true);
    try {
      await this.auth.register({
        nom: this.nom.trim(),
        prenom: this.prenom.trim(),
        age,
        email: this.email.trim(),
        password: this.password,
        photo,
      });
      await this.toast.show('Inscription réussie !', 'success');
      await this.router.navigateByUrl('/tabs/movies', { replaceUrl: true });
    } catch (e) {
      await this.toast.error(e);
    } finally {
      this.loading.set(false);
    }
  }
}
