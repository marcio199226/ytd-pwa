import { InjectionToken, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BehaviorSubject } from 'rxjs';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConnectedComponent, HomeComponent } from './pages';
import { PlaylistBottomMenuSheetComponent } from './pages/connected/bottom-menu.component';
import { PlayerComponent } from './pages/connected/player.component';

export interface AppConfig {
  url: string | null;
  username: string | null;
  password: string | null;
  api_key: string | null;
}

export const APP_CONFIG = new InjectionToken<BehaviorSubject<AppConfig>>('app config');

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ConnectedComponent,
    PlaylistBottomMenuSheetComponent,
    PlayerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    HttpClientModule,
    AppRoutingModule,
    ServiceWorkerModule.register('service-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    MatBottomSheetModule,
    MatButtonModule,
    MatListModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressBarModule,
    MatToolbarModule,
    OverlayModule,
    ZXingScannerModule,
  ],
  providers: [
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        verticalPosition: 'top',
        duration: 5000
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
