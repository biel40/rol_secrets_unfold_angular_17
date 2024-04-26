import { Component, inject, Input, OnInit } from '@angular/core';
import { MaterialModule } from '../../modules/material.module';
import { Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { UserService } from '../../services/user/user.service';
import { LoaderService } from '../../services/loader/loader.service';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-profile-stats',
    templateUrl: './profile-stats.component.html',
    styleUrls: ['./profile-stats.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
    ]
})
export class ProfileStatsComponent implements OnInit {

    private _userService: UserService = inject(UserService);
    private _loaderService: LoaderService = inject(LoaderService);
    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _router = inject(Router);

    public dataSource: any[] = [];
    public displayedColumns: string[] = ['Ataque', 'Defensa', 'Ataque especial', 'Defensa especial', 'Velocidad'];

    private _user: User | null = null;

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

    ngOnChanges() : void {
        // Cuando se reciba la información del perfil, el dataSource se rellena con la info de las stats
        this.dataSource = [
            {
                'Ataque': this.profile?.attack,
                'Defensa': this.profile?.defense,
                'Ataque especial': this.profile?.special_attack,
                'Defensa especial': this.profile?.special_defense,
                'Velocidad': this.profile?.speed
            }
        ];
    }

    private _displaySnackbar(message: string) {
        // Le damos margen abajo
        this._snackBar.open(message, 'Cerrar', {
            duration: 5000,
            verticalPosition: 'bottom'
        });
    }

}