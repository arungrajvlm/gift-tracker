import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules, withHashLocation } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, search, person, helpCircle, logOutOutline, close, menu, construct, arrowUpCircle, arrowDownCircle, chevronForward, trash, trashOutline, pencil, createOutline, arrowBack, arrowUp, arrowDown, send, giftOutline, arrowDownOutline, cloudDone, cloudUpload, cloudOffline, sync } from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import { importProvidersFrom } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';

import { provideHttpClient } from '@angular/common/http';

import { fancyAnimation } from './app/animations/nav.animation';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from './environments/environment';

// Register Icons Globally (Entry Point)
addIcons({
  add, search, person, helpCircle, logOutOutline, close, menu, construct,
  arrowUpCircle, arrowDownCircle, chevronForward, trash, trashOutline,
  pencil, createOutline, arrowBack, arrowUp, arrowDown, send,
  giftOutline, arrowDownOutline, cloudDone, cloudUpload, cloudOffline, sync
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      navAnimation: fancyAnimation,
      mode: 'ios' // Unify look
    }),
    provideRouter(routes, withPreloading(PreloadAllModules), withHashLocation()),
    provideHttpClient(),
    importProvidersFrom(IonicStorageModule.forRoot({
      driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
    })),
    // Firebase Providers
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
});

