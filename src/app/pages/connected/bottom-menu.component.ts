import { Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

@Component({
  selector: 'playlist-bottom-menu',
  templateUrl: 'bottom-menu.component.html',
})
export class PlaylistBottomMenuSheetComponent {
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { playlist: any },
    private _bottomSheetRef: MatBottomSheetRef<PlaylistBottomMenuSheetComponent>
  ) {}

  triggerAction($event: any, action: string): void {
    $event.preventDefault();
    this._bottomSheetRef.dismiss({ action });
  }
}
