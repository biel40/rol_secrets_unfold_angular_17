import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material.module';
import { UserService } from '../../services/user/user.service';
import { Hability, Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { ProfileStateService } from '../../services/profile/profile-state.service';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { MatDialog } from '@angular/material/dialog';
import { DiceMatDialogComponent } from '../dialogs/dice-mat-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';

@Component({
    selector: 'app-player-habilities',
    templateUrl: './player-habilities.component.html',
    styleUrls: ['./player-habilities.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MaterialModule,
    ]
})
export class PlayerHabilitiesComponent implements OnInit {

    private _userService: UserService = inject(UserService);
    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _profileState = inject(ProfileStateService);
    private _router = inject(Router);
    private _dialog = inject(MatDialog);
    private _overlay = inject(Overlay);
    private _snackBar = inject(MatSnackBar);
    private _cdr = inject(ChangeDetectorRef);

    public animateDice: boolean = false;
    public user: User | null = null;
    
    public get userHabilities(): Hability[] {
        return this._profileState.userHabilities();
    }

    private get _profile(): Profile | null {
        return this._profileState.profile();
    }

    ngOnInit(): void {
        this.user = this._userService.getUser();

        if (!this.user) {
            this._displaySnackbar('Credenciales inválidas. Por favor, inicie sesión nuevamente.', 'error');
            this._router.navigate(['']);
        }
    }

    public async refreshHabilities(): Promise<void> {
        await this._profileState.refreshHabilities();
    }

    public addUses(hability: Hability) {
        if (hability) {

            if (hability.current_uses >= hability.total_uses) {
                return;
            }

            hability.current_uses++;

            if (this._profile) {
                this._supabaseService.updateHabilityUses(hability, this._profile);
            } else {
                console.error('Profile is null');
            }
        }
    }

    public removeUses(hability: Hability) {
        if (hability) {

            if (hability.current_uses == 0) {
                return;
            }

            hability.current_uses--;

            if (this._profile) {
                this._supabaseService.updateHabilityUses(hability, this._profile);
            } else {
                console.error('Profile is null');
            }
        }
    }

    public calculateDamage(hability: Hability): any {
        if (hability) {
            
            // Prevent opening multiple dialogs if one is already open
            if (this._dialog.openDialogs.length > 0) {
                return;
            }

            if (hability.current_uses <= 0) {
                this._displaySnackbar('No tienes más usos disponibles para esta habilidad.', 'error');
                return;
            }

            this.openDialog(hability);
        }
    }

    public openDialog(hability: Hability): void {
        // Clone the hability to avoid modifying the parent view state during the dialog's lifecycle (NG0100 fix)
        const habilityClone = { ...hability };
        // Clone the profile to pass to the dialog and avoid async loading
        const profileClone = this._profile ? { ...this._profile } : null;

        const dialogRef = this._dialog.open(DiceMatDialogComponent, {
            data: { 
                hability: habilityClone,
                profile: profileClone
            },
            width: '500px',
            maxHeight: '90vh',
            panelClass: 'responsive-dialog',
            autoFocus: false,
            disableClose: false,
            scrollStrategy: this._overlay.scrollStrategies.noop()
        });
        
        // Update local state when dialog closes (and changes were made)
        dialogRef.afterClosed().subscribe(() => {
            // Check if uses changed in the clone
            if (habilityClone.current_uses !== hability.current_uses) {
                hability.current_uses = habilityClone.current_uses;
                this._cdr.detectChanges();
            }
        });
    }

    private _displaySnackbar(message: string, type: 'success' | 'error' = 'success'): void {
        const panelClass = type === 'error' ? 'snack-bar-danger' : 'snack-bar-success';

        this._snackBar.open(message, 'Cerrar', {
            duration: 3500,
            verticalPosition: 'bottom',
            panelClass: [panelClass]
        });
    }

    public getPowerIcon(power: string | undefined): string {
        const icons: Record<string, string> = {
            'Pyro': '🔥',
            'Hydro': '💧',
            'Electro': '⚡',
            'Geo': '🪨',
            'Cryo': '❄️',
            'Natura': '🌿',
            'Anemo': '💨',
            'Dendro': '🌱'
        };
        return icons[power || ''] || '✨';
    }
}
