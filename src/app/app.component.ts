import { ChangeDetectionStrategy, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { BarcodeFormat } from '@zxing/browser';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';
import { BehaviorSubject } from 'rxjs';
import { YtdApi } from './api/ytd';
import { AppConfig, APP_CONFIG } from './app.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {

  @ViewChild(ZXingScannerComponent, { static: false })
  scanner!: ZXingScannerComponent;

  showScanner: boolean = false;

  allowedFormats = [ BarcodeFormat.QR_CODE ];

  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private readonly _pwaUpdate: SwUpdate,
    @Inject(APP_CONFIG) private _config: BehaviorSubject<AppConfig>,
    private _ytdApi: YtdApi,
    private _snackbar: MatSnackBar
  ) {
    this._pwaUpdate.available.subscribe(event => {
      console.log('app updates', event)
      if(event) {
        const ok = confirm("new update available do you want to update?")
        if(ok) {
          this._pwaUpdate.activateUpdate().then(() => document.location.reload());
        }
      }
    });
  }

  ngOnInit(): void {
    console.log('AppComponent', this._config.value)
    if(this._config.value.url) {
      this._router.navigate(["connected"]);
    }
  }


  async scan(): Promise<void> {
    this.showScanner = true;
  }

  closeScanner(): void {
    this.showScanner = false;
  }

  checkPermissions(hasPermission: boolean): void {
    console.log('checkPermissions', hasPermission)
    if(!hasPermission) {
      this.showScanner = false;
      this._snackbar.open("Missing camera permissions");
    }
  }

  camerasNotFoundHandler($event: any): void {
    console.log('camerasNotFoundHandler', $event)
    this.showScanner = false;
    this._snackbar.open("Something goes wrong");
  }

  scanCompleteHandler($event: any): void {
    console.log('scanCompleteHandler', $event)
    const { text } = $event || {};
    if(!text) {
      return;
    }

    let queryParams: any = {};
    const url = new URL(text);
    url.searchParams.forEach((value, key) => queryParams[key] = value)
    this.showScanner = false;
    this._config.next({ ...queryParams });
    console.log('bere redirect to connected', this._config.value, queryParams)
    this._router.navigate(["connected"], { queryParams })
  }

  onScanError($event: any): void {
    console.log('onScanError', $event);
    this.showScanner = false;
    this._snackbar.open("Cannot scan qrcode");
  }
}
