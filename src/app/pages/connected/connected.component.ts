import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, NgZone, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { YtdApi } from 'src/app/api/ytd';
import { AppConfig, APP_CONFIG } from 'src/app/app.module';
import { PlaylistBottomMenuSheetComponent } from './bottom-menu.component';
import { Howl, Howler } from 'howler';
import { PlayerComponent } from './player.component';

@Component({
  selector: 'connected',
  templateUrl: './connected.component.html',
  styleUrls: ['./connected.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectedComponent implements OnInit {

  public hostInfo: { id: string | null, username: string | null } = {id: null, username: null};

  public entries: any[] = [];

  public playlists: any[] = [];

  public loading: boolean = true;

  public downloading: any = {};

  @ViewChild('playlistDetails')
  private _playlistDetailsTpl!: TemplateRef<any>;

  constructor(
    private _router: Router,
    @Inject(APP_CONFIG) private _config: BehaviorSubject<AppConfig>,
    private _zone: NgZone,
    private _cdr: ChangeDetectorRef,
    private _viewContainerRef: ViewContainerRef,
    private _ytdApi: YtdApi,
    private _snackbar: MatSnackBar,
    private _overlay: Overlay,
    private _bottomSheet: MatBottomSheet
  ) { }

  ngOnInit(): void {
    console.log('ConnectedComponent', this._config.value, window.location)
    if(!this._config.value.url) {
      this._router.navigate(['home']);
      return;
    }

    this._ytdApi.getState().subscribe(
      response => {
        console.log(response);
        this.hostInfo = response.host;
        this.playlists = response.offlinePlaylists;
        this.entries = response.entries;
        this.loading = false;
        this._cdr.detectChanges();
      },
      response => {
        console.log('getState error', response)
        if(response.status === 404) {
          this._router.navigate(['home']);
          this._snackbar.open("Something goes wrong, please verify that public server is up & running");
          return;
        }

        this._router.navigate(['home']);
        this._snackbar.open("Something goes wrong, unexpected error");
      }
    );
  }

  trackByUUID(idx: number, val: any): string {
    return val ? val.uuid : null;
  }

  showMenu($event: any, playlist: any): void {
    $event.stopPropagation();
    const menuRef = this._bottomSheet.open(PlaylistBottomMenuSheetComponent, { data: { playlist } });
    menuRef.afterDismissed().subscribe(async ({action} = {}) => {
      console.log('Bottom sheed action', action);
      if(!action) {
        return;
      }

      if(action === 'download-streaming') {
        await this.startDownload(playlist);
        return;
      }

      if(action === 'playback') {
        const overlayRef = this._overlay.create({
          positionStrategy: this._overlay.position().global().centerHorizontally().centerVertically(),
          height: '100%',
          width: '100%',
          backdropClass: 'overlay-backdrop-darker',
          hasBackdrop: true,
          disposeOnNavigation: true
        });

        const tracks = this.entries.filter(e => e.type === 'track' && playlist.tracksIds.indexOf(e.track.id) > -1).map(e => e.track);
        const cmpPortal = new ComponentPortal(PlayerComponent, this._viewContainerRef);
        const cmpRef = overlayRef.attach(cmpPortal);
        cmpRef.instance.playlist = playlist;
        cmpRef.instance.tracks = tracks;
        cmpRef.instance.overlayRef = overlayRef;
        cmpRef.instance.playback();
      }
    });
  }

  async startDownload(playlist: any): Promise<void> {
    console.log('startDownload', playlist)
    if (!('BackgroundFetchManager' in self)) {
      this._snackbar.open("Sorry but your browser does not support background downloads");
      return;
    }

    this._snackbar.open("Download has been started");
    // fetch download size to calculate progress
    const ids = this.playlists.find(p => p.uuid === playlist.uuid).tracksIds;
    const totalSize = this.entries.filter((e: any) => e.type === 'track' && e.source === 'youtube' && ids.indexOf(e.track.id) > -1).reduce((prev: number, current: any, idx: number, arr: any[]) => {
      const filesize = current.track.converting.status === 'converted' ? current.track.converting.filesize : current.track.filesize;
      return prev + filesize;
    }, 0);

    console.log('background fetch available')
    const sw = await navigator.serviceWorker.ready;
    console.log('Obtained sw', sw);
    const pwaBroadcastChannel = new BroadcastChannel('ytd-pwa');

    pwaBroadcastChannel.onmessage = (event) => {
      console.log("Received message from service-worker", event);
      if(!event.data || (event.data && !event.data.name)) {
        return;
      }

      const { name: eventName, payload } = event.data;
      switch(eventName) {
        case 'PLAYLIST_DOWNLOADED':
          const { id } = payload;
          // remove playlist from downloading ones
          const { [id]: remove, ...downloading } = this.downloading;
          this.downloading = downloading;
          this._snackbar.open(`Playlist ${playlist.name} has been downloaded`);
          this._cdr.detectChanges();
          window.localStorage.setItem('playlists-downloaded', JSON.stringify([id]));
        break;
      }
    }
    const urls = playlist.tracksIds.map((id: string) => `${this._config.value.url}/app/download/youtube/${id}.mp3`);

    // @ts-ignore
    const exists = await sw.backgroundFetch.get(playlist.uuid); // BackgroundFetchRegistration
    console.log("Check if download exists:", exists);
    if(exists) {
      await exists.abort();
    }

    try {
      // @ts-ignore
      const bgFetch = await sw.backgroundFetch.fetch(playlist.uuid, urls, {
        title: `Playlist: ${playlist.name}`,
        icons: [{
          sizes: '300x300',
          src: '/ep-5-icon.png',
          type: 'image/png',
        }],
        downloadTotal: totalSize,
      });

      if(bgFetch.failureReason) {
        switch(bgFetch.failureReason) {
          case 'bad-status':

          break;
          case 'fetch-error':
          break;
          case 'quota-exceeded':

          break;
          case 'download-total-exceeded':

          break;
        }
      }

      pwaBroadcastChannel.postMessage({ name: 'playlist-info', payload: { playlist } });
      this.downloading[playlist.uuid] = true;
      this._cdr.detectChanges();

      bgFetch.onprogress = () => {
        console.log('bgFetch.onprogress', bgFetch, Math.round(bgFetch.downloaded / bgFetch.downloadTotal * 100));
        if(bgFetch) {
          this.downloading[playlist.uuid] = { progress: Math.round(bgFetch.downloaded / bgFetch.downloadTotal * 100)};
          this._cdr.detectChanges();
        }
      }
    } catch(e) {
      console.log("Background fetch failed with error", e);
    }
  }

  isDownloading(playlist: any): boolean {
    return this.downloading[playlist.uuid];
  }

  showDetails(playlist: any): void {
    const overlayRef = this._overlay.create({
      positionStrategy: this._overlay.position().global().centerHorizontally().centerVertically(),
      height: '100%',
      backdropClass: 'overlay-backdrop-darker',
      hasBackdrop: true,
      disposeOnNavigation: true
    });

    const tracks = this.entries.filter(e => e.type === 'track' && playlist.tracksIds.indexOf(e.track.id) > -1).map(e => e.track);
    const tpl = new TemplatePortal(this._playlistDetailsTpl, this._viewContainerRef, { playlist, tracks, close: () => overlayRef.dispose() });
    overlayRef.attach(tpl);
  }

  trackByTrackId(idx: number, val: any): string {
    return val ? val.id : null;
  }
}
