import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoModule } from '@jsverse/transloco';
import { MaterialModule } from '../../../modules/material.module';
import { AdminStateService } from '../../../services/admin/admin-state.service';
import { Hability, SupabaseService } from '../../../services/supabase/supabase.service';
import { HabilityDialogComponent } from '../../dialogs/hability-dialog/hability-dialog.component';
import { HabilityAssociationDialogComponent, HabilityAssociationDialogResult } from '../../dialogs/hability-association-dialog/hability-association-dialog.component';

@Component({
    selector: 'app-habilities-tab',
    standalone: true,
    imports: [CommonModule, FormsModule, MaterialModule, TranslocoModule],
    templateUrl: './habilities-tab.component.html',
    styleUrls: ['./habilities-tab.component.scss']
})
export class HabilitiesTabComponent implements OnInit {
    public readonly state = inject(AdminStateService);
    private readonly _dialog = inject(MatDialog);
    private readonly _supabaseService = inject(SupabaseService);

    public ngOnInit(): void {
        if (this.state.habilities().length === 0) {
            this.state.loadHabilities();
        }
    }

    public openCreateHabilityDialog(): void {
        const dialogRef = this._dialog.open(HabilityDialogComponent, {
            data: {},
            width: '650px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            disableClose: false,
            autoFocus: false
        });

        dialogRef.afterClosed().subscribe(async (result) => {
            if (result) {
                await this.state.createHability(result.hability, result.associatedProfiles || []);
            }
        });
    }

    public async editHability(hability: Hability): Promise<void> {
        try {
            const associatedProfiles = await this._supabaseService.getAssociatedProfiles(hability.id!);

            const dialogRef = this._dialog.open(HabilityDialogComponent, {
                data: { hability, associatedProfiles },
                width: '650px',
                maxWidth: '95vw',
                maxHeight: '90vh',
                disableClose: false,
                autoFocus: false
            });

            dialogRef.afterClosed().subscribe(async (result) => {
                if (result) {
                    await this.state.updateHability(result.hability, result.associatedProfiles || []);
                }
            });
        } catch (error) {
            console.error('Error loading associated profiles:', error);
            this.state.showSnackbar('Error al cargar los perfiles asociados.');
        }
    }

    public async deleteHability(hability: Hability): Promise<void> {
        if (confirm(`¿Estás seguro de que deseas eliminar la habilidad ${hability.name}?`)) {
            await this.state.deleteHability(hability);
        }
    }

    public async openAssociateModal(hability: Hability): Promise<void> {
        const currentAssociations = hability.id
            ? await this._supabaseService.getAssociatedProfiles(hability.id)
            : [];

        const dialogRef = this._dialog.open(HabilityAssociationDialogComponent, {
            data: {
                hability,
                profiles: this.state.profiles(),
                currentAssociations
            },
            width: '600px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            panelClass: 'hability-association-dialog-panel',
            disableClose: false,
            autoFocus: false
        });

        dialogRef.afterClosed().subscribe((result: HabilityAssociationDialogResult | undefined) => {
            if (result) {
                this.state.updateHabilityAssociations(result.habilityId, result.selectedProfiles);
                const habilityName = hability.name || 'la habilidad';
                const message = result.selectedProfiles.length > 0
                    ? `${habilityName} asociada correctamente con ${result.selectedProfiles.length} perfil(es).`
                    : `Se eliminaron todas las asociaciones de ${habilityName}.`;
                this.state.showSnackbar(message);
            }
        });
    }

    public clearFilters(): void {
        this.state.clearHabilityFilters();
    }
}
