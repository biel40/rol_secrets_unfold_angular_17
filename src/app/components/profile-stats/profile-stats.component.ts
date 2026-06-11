import { Component, inject, OnInit, effect } from '@angular/core';
import { MaterialModule } from '../../modules/material.module';
import { UserService } from '../../services/user/user.service';
import { ProfileStateService } from '../../services/profile/profile-state.service';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoModule } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-profile-stats',
    templateUrl: './profile-stats.component.html',
    styleUrls: ['./profile-stats.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
        TranslocoModule,
        CommonModule,
    ]
})
export class ProfileStatsComponent implements OnInit {

    private _userService: UserService = inject(UserService);
    private _profileState = inject(ProfileStateService);
    private _router = inject(Router);

    public keys: string[] = [];
    public dataSource: any[] = [];
    public displayedColumns: string[] = ['Ataque', 'Defensa', 'Ataque especial', 'Defensa especial', 'Velocidad'];

    public isMobile: boolean = false;
    private _user: User | null = null;
    public lastUpdatedLabel: string = '---';

    constructor(
        private _snackBar: MatSnackBar
    ) {
        this._user = this._userService.getUser();
        this._detectIfMobile();

        // Reacts to profile signal: runs on init and whenever profile updates (e.g. after stats edit).
        effect(() => {
            const profile = this._profileState.profile();
            this.dataSource = [{
                '\u2764\ufe0f Vida': profile?.current_hp + '/' + profile?.total_hp,
                ' Ataque': profile?.attack,
                'Defensa': profile?.defense,
                'Ataque especial': profile?.special_attack,
                'Defensa especial': profile?.special_defense,
                'Velocidad': profile?.speed
            }];
            this.keys = Object.keys(this.dataSource[0]);
            this.lastUpdatedLabel = profile ? this._formatUpdatedAt() : '---';
        });
    }

    async ngOnInit(): Promise<void> {
        if (!this._user) {
            this._displaySnackbar('Credenciales inválidas. Por favor, inicie sesión nuevamente.');
            this._router.navigate(['']);
        }
    }

    private _formatUpdatedAt(): string {
        const profile = this._profileState.profile();
        if (!profile?.updated_at) return '---';
        const date = new Date(profile.updated_at);
        if (Number.isNaN(date.getTime())) return '---';
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    public goToEditStats(): void {
        this._router.navigate(['profile-stats-edit']);
    }

    private _detectIfMobile() : void {
        if (window.innerWidth <= 768) {
            this.isMobile = true;
        }
    }

    private _displaySnackbar(message: string) {
        this._snackBar.open(message, 'Cerrar', {
            duration: 5000,
            verticalPosition: 'bottom'
        });
    }

    /**
     * Converts a stat value to a percentage for the stat bar
     * @param value The stat value
     * @returns A percentage between 0-100
     */
    public getStatPercentage(value: any): number {
        if (!value || isNaN(Number(value))) return 0;
        
        // Max stat value is considered to be 20 (typical for RPG games)
        const maxStat = 20;
        const percentage = (Number(value) / maxStat) * 100;
        
        // Cap at 100%
        return Math.min(percentage, 100);
    }
}