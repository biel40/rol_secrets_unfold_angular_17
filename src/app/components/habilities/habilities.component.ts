import { Component, inject, Input, OnInit } from '@angular/core';
import { MaterialModule } from '../../modules/material.module';
import { UserService } from '../../services/user/user.service';
import { LoaderService } from '../../services/loader/loader.service';
import { Hability, Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { MatDialog } from '@angular/material/dialog';
import { DiceMatDialogComponent } from '../dialogs/dice-mat-dialog.component';
import { Overlay, ScrollStrategy } from '@angular/cdk/overlay';

@Component({
    selector: 'app-habilities',
    templateUrl: './habilities.component.html',
    styleUrls: ['./habilities.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
    ]
})
export class HabilitiesComponent implements OnInit {

    private _userService: UserService = inject(UserService);
    private _loaderService: LoaderService = inject(LoaderService);
    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _router = inject(Router);
    private _overlay = inject(Overlay);

    public animateDice: boolean = false;

    public user: User | null = null;

    @Input() public profile: Profile | null = null;

    public userHabilities: Hability[] = [];

    constructor(public dialog: MatDialog) { }

    async ngOnInit(): Promise<void> {
        this._loaderService.setLoading(true);

        this.user = await this._userService.getUser();

        if (!this.user) {
            alert('Credenciales inválidas. Por favor, inicie sesión nuevamente.');
            this._router.navigate(['']);
        }
    }

    async ngOnChanges() {
        if (this.profile) {
            this.userHabilities = (await this._supabaseService.getHabilitiesFromUser(this.profile));
        } else {
            this.userHabilities = [];
        }

        this._loaderService.setLoading(false);
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
                alert('No tienes más usos disponibles para esta habilidad.');
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

}