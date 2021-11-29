import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, NgZone, OnInit, PLATFORM_ID, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { YtdApi } from 'src/app/api/ytd';
import { AppConfig, APP_CONFIG } from 'src/app/app.module';
import { PlaylistBottomMenuSheetComponent } from './bottom-menu.component';
import { Howl, Howler } from 'howler';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerComponent implements OnInit {

  @Input()
  public tracks: any[] = [];

  @Input()
  public playlist: any = null;

  @Input()
  public overlayRef: OverlayRef | null = null;

  public player: Howl | null = null;

  public playing: boolean = true;

  public idx: number = 0;

  public elapsedTimeProgress: number = 0;

  public elapsedTime: string = '';

  public get currentTrack(): any {
    return this.tracks[this.idx];
  }

  public get trackCover(): string {
    if(!this.currentTrack) {
      return '';
    }
    return this.currentTrack.thumbnails[this.currentTrack.thumbnails.length - 1];
  }

  public get duration(): number {
    return this.player!.duration();
  }

  public get isReady(): boolean {
    if(!this.player) {
      return false;
    }
    return this.player.state() === 'loaded';
  }

  public get hasNext(): boolean {
    return this.idx + 1 < this.tracks.length;
  }

  public get hasPrev(): boolean {
    return this.idx - 1 >= 0;
  }

  private _calcTime: any = null;

  constructor(
    private _router: Router,
    @Inject(PLATFORM_ID) private _platform: Platform,
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
  }

  playback(): void {
    this.player = new Howl({
      src: this._getTrackUrl(),
      html5: true,
      autoplay: true,
      onplay: (id) => {
        console.log('onplay', this.player!.seek(), this.player!.rate());
        this._calcTime = setInterval(() => {
          console.log('calc time');
          const s = parseInt((this.player!.seek() % 60).toString(), 10);
          const m = parseInt(((this.player!.seek() / 60) % 60).toString(), 10);
          this.elapsedTimeProgress = +(
            (+this.player!.seek().toFixed(1) / +this.duration.toFixed(1)) * 100
          ).toFixed(0);
          this.elapsedTime = s < 10 ? m + ':0' + s : m + ':' + s;
          this._cdr.detectChanges();
        }, 1000);
      },
      onpause: (id) => {
        clearInterval(this._calcTime);
      },
      onend: (id) => {
        clearInterval(this._calcTime);
        this.next();
      },
      onloaderror: (id, err) => {
        this._snackbar.open("Cannot load track");
        this.close();
      },
      onplayerror: (id, err) => {
        this._snackbar.open("Cannot playback");
        this.close();
        this.player!.once('unlock', () => {
          this.player!.play();
        });
      }
    });

    this._cdr.detectChanges();
  }

  play(): void {
    this.playing = true;
    this.player?.play();
    this._cdr.detectChanges();
  }

  pause(): void {
    this.playing = false;
    this.player?.pause();
    this._cdr.detectChanges();
  }

  next(): void {
    if(!this.hasNext) {
      return;
    }

    this.idx++;
    this.playing = true;
    clearInterval(this._calcTime);
    this.player?.unload();
    this.playback();
  }

  prev(): void {
    if(!this.hasPrev) {
      return;
    }

    this.idx--;
    this.playing = true;
    clearInterval(this._calcTime);
    this.player?.unload();
    this.playback();
  }

  close(): void {
    if(!this.overlayRef) {
      return;
    }
    this.player!.stop();
    this.player = null;
    this.overlayRef.dispose();
  }

  private _getTrackUrl(): string {
    return `${this._config.value.url}/app/download/youtube/${this.tracks[this.idx].id}.mp3`;
  }
}
