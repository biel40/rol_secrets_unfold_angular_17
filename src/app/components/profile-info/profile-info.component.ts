import { Component, inject, Input, OnInit } from '@angular/core';
import { MaterialModule } from '../../modules/material.module';
import { Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { UserService } from '../../services/user/user.service';
import { LoaderService } from '../../services/loader/loader.service';
import { User } from '@supabase/supabase-js';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-profile-info',
    templateUrl: './profile-info.component.html',
    styleUrls: ['./profile-info.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
        RouterLink
    ]
})
export class ProfileInfoComponent implements OnInit {

    private _userService: UserService = inject(UserService);
    private _loaderService: LoaderService = inject(LoaderService);
    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _router = inject(Router);

    private _user: User | null = null;

    public classEmoji = '👋';
    public elementEmoji = '🔥';

    @Input() profile: Profile | null = null;

    constructor(
        private _snackBar: MatSnackBar
    ) {
        this._user = this._userService.getUser();
    }

    async ngOnInit(): Promise<void> {
        this._loaderService.setLoading(true);
        
        if (!this._user) {
            alert('Credenciales inválidas. Por favor, inicie sesión nuevamente.');
            this._router.navigate(['']);
        } 
    }

    public ngOnChanges() : void {
        this.setClassEmoji();
        this.setElementEmoji();
        this._loaderService.setLoading(false);
    }

    public setClassEmoji() : void {
        // TODO: Completar
        console.log('Clase: ', this.profile?.clase);

        if (this.profile?.clase.toUpperCase() == 'GUERRERO') {
            this.classEmoji = '⚔️';
        } else if (this.profile?.clase.toUpperCase() == 'MAGO') {
            this.classEmoji = '🧙';
        } else if (this.profile?.clase.toUpperCase() == 'SACERDOTE') {
            this.classEmoji = '⛪';
        }
    }

    public setElementEmoji() : void {
        if (this.profile?.power.toUpperCase() == 'PYRO') {
            this.elementEmoji = '🔥';
        } else if (this.profile?.power.toUpperCase() == 'HYDRO') {
            this.elementEmoji = '💧';
        } else if (this.profile?.power.toUpperCase() == 'ELECTRO') {
            this.elementEmoji = '⚡';
        } else if (this.profile?.power.toUpperCase() == 'CRYO') {
            this.elementEmoji = '❄️';
        } else if (this.profile?.power.toUpperCase() == 'GEO') {
            this.elementEmoji = '🌍';
        }
    }
  

    private _displaySnackbar(message: string) {
        this._snackBar.open(message, 'Cerrar', {
            duration: 5000
        });
    }

}