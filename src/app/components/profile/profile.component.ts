import { Component, inject, OnInit } from '@angular/core';
import { Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { User } from '@supabase/supabase-js';
import { UserService } from '../../services/user/user.service';
import { LoaderService } from '../../services/loader/loader.service';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../modules/material.module';
import { ProfileInfoComponent } from '../profile-info/profile-info.component';
import { ProfileStatsComponent } from '../profile-stats/profile-stats.component';
import { HabilitiesComponent } from '../habilities/habilities.component';
import { LocaleChangerComponent } from '../locale-changer/locale-changer.component';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
        ProfileInfoComponent,
        ProfileStatsComponent,
        HabilitiesComponent,
        TranslocoModule,
        LocaleChangerComponent,
        RouterLink,
    ]
})
export class ProfileComponent implements OnInit {

    private _userService: UserService = inject(UserService);
    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _loaderService: LoaderService = inject(LoaderService);
    private _router = inject(Router);

    public profile: Profile | null = null;
    private _user: User | null = null;

    public errorConfirmEmail: boolean = false;

    constructor(
        private _snackBar: MatSnackBar
    ) {
        this._user = this._userService.getUser();
    }

    async ngOnInit(): Promise<void> {
        this._loaderService.setLoading(true);
        
        if (this._user) {
            let profile = (await this._supabaseService.getProfileInfo(this._user.id)).data;

            if (profile) {
                this.profile = profile;
            }
        } else {
            this._displaySnackbar('Ha ocurrido un error al intentar obtener la información del perfil. Por favor, vuelva a iniciar sesión.');
            this.errorConfirmEmail = true;
        }

        this._loaderService.setLoading(false);
    }


    public async signOut() {
        this._loaderService.setLoading(true);
        this._userService.clearUser();
        this._supabaseService.signOut();

        setTimeout(() => {
            this._loaderService.setLoading(false);
            this._router.navigate(['']);
        }, 500);
    }

    private _displaySnackbar(message: string) : void {
        this._snackBar.open(message, 'Cerrar', {
          duration: 4000,
        });
      }
    
      public ngOnDestroy(): void {
        this._loaderService.setLoading(false);
      }

}