import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules, withHashLocation } from '@angular/router';
// ...
provideRouter(routes, withPreloading(PreloadAllModules), withHashLocation()),
  provideHttpClient(),
  importProvidersFrom(IonicStorageModule.forRoot({
    driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
  })),
  // Firebase Providers
  provideFirebaseApp(() => initializeApp(environment.firebase)),
  provideAuth(() => getAuth()),
  ],
});
