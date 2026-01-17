import { Component, inject, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material.module';
import { UserService } from '../../services/user/user.service';
import { Hability, Profile, SupabaseService } from '../../services/supabase/supabase.service';
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
export class PlayerHabilitiesComponent implements OnInit, OnChanges {

    private _userService: UserService = inject(UserService);
    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _router = inject(Router);
    private _overlay = inject(Overlay);
    private _snackBar = inject(MatSnackBar);
    private _cdr = inject(ChangeDetectorRef);

    public animateDice: boolean = false;

    public user: User | null = null;

    @Input() public profile: Profile | null = null;

    public userHabilities: Hability[] = [];

    constructor(public dialog: MatDialog) { }

    async ngOnInit(): Promise<void> {
        this.user = await this._userService.getUser();

        if (!this.user) {
            this._displaySnackbar('Credenciales inválidas. Por favor, inicie sesión nuevamente.', 'error');
            this._router.navigate(['']);
        }
    }

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes['profile'] && this.profile) {
            this.userHabilities = await this._supabaseService.getHabilitiesFromUser(this.profile);
            this._cdr.detectChanges();
        } else if (!this.profile) {
            this.userHabilities = [];
        }
    }

    public async refreshHabilities(): Promise<void> {
        if (this.profile) {
            this.userHabilities = await this._supabaseService.getHabilitiesFromUser(this.profile);
        }
    }

    public addUses(hability: Hability) {
        if (hability) {

            if (hability.current_uses >= hability.total_uses) {
                return;
            }

            hability.current_uses++;

            if (this.profile) {
                this._supabaseService.updateHabilityUses(hability, this.profile);
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

            if (this.profile) {
                this._supabaseService.updateHabilityUses(hability, this.profile);
            } else {
                console.error('Profile is null');
            }
        }
    }

    public calculateDamage(hability: Hability): any {
        if (hability) {

            if (hability.current_uses <= 0) {
                this._displaySnackbar('No tienes más usos disponibles para esta habilidad.', 'error');
                return;
            }

            this.openDialog(hability);
        }
    }

    public openDialog(hability: Hability): void {
        const dialogRef = this.dialog.open(DiceMatDialogComponent, {
            data: { 
                hability: hability
            },
            width: '500px',
            maxHeight: '90vh',
            panelClass: 'responsive-dialog',
            autoFocus: false,
            disableClose: false,
            scrollStrategy: this._overlay.scrollStrategies.noop()
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
