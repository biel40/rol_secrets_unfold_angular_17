import { Component, inject, OnInit } from '@angular/core'
import { Enemy, SupabaseService } from './services/supabase/supabase.service'
import { RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { TranslocoService } from '@jsverse/transloco';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterOutlet,
    SpinnerComponent
  ]
})
export class AppComponent implements OnInit {

  private _translocoService: TranslocoService = inject(TranslocoService);

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
      
      alert('¡Empieza un combate! Los enemigos son: ' + this.enemiesOfBattle.map(enemy => enemy.name).join(', '));
    }
    
  }

  private async _loadData(): Promise<void> {
    this.battleChannel = await this._supabaseService.getBroadcastBattleChannel();

    this.battleChannel.on( 'broadcast', { event: 'test' }, (payload) => this.messageReceived(payload))
      .subscribe()
  }


}