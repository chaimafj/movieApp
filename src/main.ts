import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

// Interface caméra pour le navigateur (ionic serve).
defineCustomElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
}).catch((err) => console.error(err));
