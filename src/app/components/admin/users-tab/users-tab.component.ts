import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoModule } from '@jsverse/transloco';
import { MaterialModule } from '../../../modules/material.module';
import { AdminStateService } from '../../../services/admin/admin-state.service';
import { Profile, SupabaseService, UserReplica } from '../../../services/supabase/supabase.service';
import { ProfileEditDialogComponent } from '../../dialogs/profile-edit-dialog/profile-edit-dialog.component';
import { ViewHabilitiesDialogComponent } from '../../dialogs/view-habilities-dialog/view-habilities-dialog.component';

@Component({
    selector: 'app-users-tab',
    standalone: true,
    imports: [CommonModule, FormsModule, MaterialModule, TranslocoModule],
    templateUrl: './users-tab.component.html',
    styleUrls: ['./users-tab.component.scss']
})
export class UsersTabComponent {
    public readonly state = inject(AdminStateService);
    private readonly _dialog = inject(MatDialog);
    private readonly _supabaseService = inject(SupabaseService);

    public showProfileModal = false;
    public selectedUser: UserReplica | null = null;

    public async deleteUser(user: UserReplica & { profile?: Profile }): Promise<void> {
        const userName = user.profile?.username || user.email;
        if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${userName}? Esta acción no se puede deshacer.`)) {
            await this.state.deleteUser(user);
        }
    }

    public openCreateProfileModal(user: UserReplica): void {
        this.selectedUser = user;
        this.showProfileModal = true;
    }

    public closeProfileModal(): void {
        this.showProfileModal = false;
        this.selectedUser = null;
    }

    @HostListener('window:keydown', ['$event'])
    public handleShortcut(event: KeyboardEvent): void {
        if (!(event.metaKey || event.ctrlKey)) {
            return;
        }

        if (event.key.toLowerCase() !== 's') {
            return;
        }

        if (!this.showProfileModal) {
            return;
        }

        event.preventDefault();
        const form = document.querySelector<HTMLFormElement>('form#profileForm');
        form?.requestSubmit();
    }

    public async createProfile(profileData: Partial<Profile>): Promise<void> {
        if (!this.selectedUser) return;

        const success = await this.state.createProfileForUser(this.selectedUser.id, profileData);
        if (success) {
            this.closeProfileModal();
        }
    }

    public editUserProfile(user: UserReplica & { profile?: Profile }): void {
        if (!user.profile) {
            this.state.showSnackbar('Este usuario no tiene un perfil creado.');
            return;
        }

        const dialogRef = this._dialog.open(ProfileEditDialogComponent, {
            data: { profile: user.profile },
            width: '800px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            disableClose: false,
            autoFocus: false
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.state.showSnackbar(`Perfil de ${user.profile?.username} actualizado correctamente.`);
                this.state.loadAllData();
            }
        });
    }

    public async toggleAwaken(user: UserReplica & { profile?: Profile }): Promise<void> {
        await this.state.toggleAwaken(user);
    }

    public async viewUserHabilities(userId: string): Promise<void> {
        try {
            const profileResult = await this._supabaseService.getProfileByUserId(userId);

            if (profileResult.error || !profileResult.data) {
                this.state.showSnackbar(profileResult.error 
                    ? 'Error al obtener el perfil del usuario.' 
                    : 'Este usuario no tiene un perfil creado.');
                return;
            }

            const habilities = await this._supabaseService.getHabilitiesFromUser(profileResult.data);

            this._dialog.open(ViewHabilitiesDialogComponent, {
                data: { profile: profileResult.data, habilities: habilities || [] },
                width: '950px',
                height: '85vh',
                maxWidth: '95vw',
                maxHeight: '95vh',
                disableClose: false,
                autoFocus: true,
                restoreFocus: true,
                hasBackdrop: true,
                backdropClass: 'custom-backdrop',
                panelClass: 'custom-dialog-container'
            });
        } catch (error) {
            console.error('Error viewing user habilities:', error);
            this.state.showSnackbar('Error al obtener las habilidades del usuario.');
        }
    }
}
