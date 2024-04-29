import { Component, inject, OnInit } from '@angular/core'
import { SupabaseService } from './services/supabase/supabase.service'
import { RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { TranslocoService } from '@jsverse/transloco';

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

  private supabase = inject(SupabaseService);
  
  constructor(
    
  ) {
    let lang = localStorage.getItem('lang');

    if (lang) {
      this._translocoService.setActiveLang(lang);
    } else {
      this._translocoService.setActiveLang('es');
    }
  }

  async ngOnInit() {
    await this.supabase.getSession().then((session) => {
      this.session = session;
    });
    
    this.supabase.authChanges((_, session) => (this.session = session));
  }
}