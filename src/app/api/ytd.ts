import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfig, APP_CONFIG } from '../app.module';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class YtdApi {

constructor(
  @Inject(APP_CONFIG) private _config: BehaviorSubject<AppConfig>,
  private _http: HttpClient
  ) { }

  getState(): Observable<any> {
    console.log('getState this._config.', this._config.value)
    return this._http.get(`${this._config.value.url}/app/state`, {
      params: {
        ...(this._config.value.api_key && { 'api-key': this._config.value.api_key })
      },
      headers: new HttpHeaders({
        ...(this._config.value.username && { 'Authorization': 'Basic ' + window.btoa(`${this._config.value.username}:${this._config.value.password}`) }),
        ...(this._config.value.api_key && { 'X-API-KEY': this._config.value.api_key })
      }),
      observe: 'body'
    })
  }

  playlistGetSize(uuid: string): Observable<any> {
    return this._http.get(`${this._config.value.url}/app/youtube/playlist/size`, { params: { uuid } });
  }
}
