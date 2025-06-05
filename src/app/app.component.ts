import { Component, inject, OnInit } from '@angular/core'
import { Enemy, SupabaseService } from './services/supabase/supabase.service'
import { RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { TranslocoService } from '@jsverse/transloco';
import { RealtimeChannel } from '@supabase/supabase-js';
import { MatDialog } from '@angular/material/dialog';
import { BattleNotificationDialogComponent } from './components/dialogs/battle-notification-dialog/battle-notification-dialog.component';
import { MaterialModule } from './modules/material.module';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterOutlet,
    SpinnerComponent,
    MaterialModule
  ]
})
export class AppComponent implements OnInit {

  private _translocoService: TranslocoService = inject(TranslocoService);
  private _dialog = inject(MatDialog);

  public session: any;
  private _supabaseService = inject(SupabaseService);
  
  public battleStarted: boolean = false;
  public battleChannel: RealtimeChannel | null = null;
  public enemiesOfBattle: Enemy[] = [];

  constructor(
    
  ) {
    let lang = localStorage.getItem('lang');

    if (lang) {
      this._translocoService.setActiveLang(lang);
    } else {
      this._translocoService.setActiveLang('es');
    }
  }

  public async ngOnInit() {
    await this._supabaseService.getSession().then((session) => {
      this.session = session;
    });
    
    this._supabaseService.authChanges((_, session) => (this.session = session));
    this._loadData();
  }

  public messageReceived(payload: any) {
    console.log('Message received: ', payload);
    this.battleStarted = true;

    if (payload.payload.enemies && payload.payload.enemies.length > 0) {
      this.enemiesOfBattle = payload.payload.enemies;
      
      // Abre el diálogo de notificación de batalla
      this._dialog.open(BattleNotificationDialogComponent, {
        data: {
          enemies: this.enemiesOfBattle,
          battleStartedBy: payload.payload.battleStartedBy || 'Game Master'
        },
        width: 'min(90vw, 650px)', // Responsive width
        minWidth: '280px', // Mínimo para móviles
        maxWidth: '650px', // Máximo para desktop
        minHeight: '350px',
        maxHeight: '95vh', // Para móviles con pantallas pequeñas
        disableClose: true,
        panelClass: ['battle-dialog-panel'],
        backdropClass: ['battle-dialog-overlay'], // Clase específica para el overlay
        autoFocus: false,
        restoreFocus: false,
        hasBackdrop: true
      });
    }
    
  }

  private async _loadData(): Promise<void> {
    this.battleChannel = await this._supabaseService.getBroadcastBattleChannel();

    this.battleChannel.on( 'broadcast', { event: 'test' }, (payload) => this.messageReceived(payload))
      .subscribe()
  }


}