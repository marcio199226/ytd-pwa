import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BehaviorSubject } from 'rxjs';

import { AppConfig, AppModule, APP_CONFIG } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

const initConfig = () => {
  const url = new URL(window.location.href);
  return new BehaviorSubject<AppConfig>({
    url: url.searchParams.get('url'),
    username: url.searchParams.get('username'),
    password: url.searchParams.get('password'),
    api_key: url.searchParams.get('api_key'),
  })
}

platformBrowserDynamic(
  [
    {
      provide: APP_CONFIG,
      useFactory: initConfig
    }
  ]
).bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
  ngZoneRunCoalescing: true,
})
  .catch(err => console.error(err));
