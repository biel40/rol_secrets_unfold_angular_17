import { Component, inject, OnInit } from '@angular/core';
import { Profile, Enemy, NPC, Mission, SupabaseService, UserReplica, ProfileSummary } from '../../../services/supabase/supabase.service';
import { UserService } from '../../../services/user/user.service';
import { RealtimeChannel, User } from '@supabase/supabase-js';
import { MaterialModule } from '../../../modules/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LocaleChangerComponent } from '../../locale-changer/locale-changer.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NPCDialogComponent } from '../../dialogs/npc-creation-dialog/npc-dialog.component';
import { MissionDialogComponent } from '../../dialogs/mission-dialog/mission-dialog.component';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
        TranslocoModule,
        LocaleChangerComponent,
        FormsModule,
        CommonModule
    ]
})
export class AdminComponent implements OnInit {

    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _userService = inject(UserService);
    private _snackBar = inject(MatSnackBar);
    private _router = inject(Router);
    private _dialog = inject(MatDialog);

    public user: User | null = null;
    public profile: Profile | null = null;
    public battleChannel: RealtimeChannel | null = null;

    public noEnemies: boolean = true;
    public enemiesList: Enemy[] = [];
    public enemiesListToStartBattle: Enemy[] = [];

    // NPC properties
    public npcsList: NPC[] = [];
    public searchTermNPCs: string = '';

    // Mission properties
    public missionsList: Mission[] = [];
    public searchTermMissions: string = '';

    // Profile selector properties
    public profilesList: ProfileSummary[] = [];
    public showAssignmentModal: boolean = false;
    public selectedMissionForAssignment: Mission | null = null;
    public selectedProfileId: string = '';

    public currentTab: 'enemies' | 'npcs' | 'quests' | 'users' = 'enemies';
    public searchTerm: string = '';

    // User management properties
    public usersList: (UserReplica & { profile?: Profile })[] = [];
    public allProfiles: Profile[] = [];
    public searchTermUsers: string = '';
    public showUserProfileModal: boolean = false;
    public selectedUserForProfile: UserReplica | null = null;

    // Computed property for filtered enemies
    public get filteredEnemies(): Enemy[] {
        if (!this.searchTerm.trim()) {
            return this.enemiesList;
        }

        const term = this.searchTerm.toLowerCase().trim();
        return this.enemiesList.filter(enemy =>
            enemy.name.toLowerCase().includes(term) ||
            (enemy.description && enemy.description.toLowerCase().includes(term)) ||
            (enemy.level && enemy.level.toString().includes(term))
        );
    }

    // Computed property for filtered NPCs
    public get filteredNPCs(): NPC[] {
        if (!this.searchTermNPCs.trim()) {
            return this.npcsList;
        }

        const term = this.searchTermNPCs.toLowerCase().trim();
        return this.npcsList.filter(npc =>
            npc.name.toLowerCase().includes(term) ||
            (npc.description && npc.description.toLowerCase().includes(term))
        );
    }

    // Computed property for filtered missions
    public get filteredMissions(): Mission[] {
        if (!this.searchTermMissions.trim()) {
            return this.missionsList;
        }

        const term = this.searchTermMissions.toLowerCase().trim();
        return this.missionsList.filter(mission =>
            mission.title.toLowerCase().includes(term) ||
            (mission.description && mission.description.toLowerCase().includes(term)) ||
            mission.status.toLowerCase().includes(term) ||
            mission.difficulty.toLowerCase().includes(term)
        );
    }

    // Computed property for filtered users
    public get filteredUsers(): (UserReplica & { profile?: Profile })[] {
        if (!this.searchTermUsers.trim()) {
            return this.usersList;
        }

        const term = this.searchTermUsers.toLowerCase().trim();
        return this.usersList.filter(user =>
            user.email.toLowerCase().includes(term) ||
            (user.user_metadata?.full_name && user.user_metadata.full_name.toLowerCase().includes(term)) ||
            (user.profile?.username && user.profile.username.toLowerCase().includes(term))
        );
    }

    constructor() { }

    public async ngOnInit(): Promise<void> {
        this.user = this._userService.getUser();

        if (this.user) {
            let profile = (await this._supabaseService.getProfileInfo(this.user.id)).data;

            if (profile) {
                this.profile = profile;
            }
        }

        await this._loadData();
    }

    private async _loadData(): Promise<void> {
        this.enemiesList = (await this._supabaseService.getEnemies()).data as Enemy[];
        this.npcsList = (await this._supabaseService.getNPCs()).data as NPC[];
        this.missionsList = (await this._supabaseService.getMissions()).data as Mission[];
        this.profilesList = (await this._supabaseService.getAllProfiles()).data as ProfileSummary[];

        // Load detailed profiles for user association
        const detailedProfiles = await this._supabaseService.getAllProfilesDetailed();
        this.allProfiles = detailedProfiles.data as Profile[];

        // Load users with their profiles
        await this._loadUsers();
    } private async _loadUsers(): Promise<void> {
        try {
            const usersData = await this._supabaseService.getAllUsers();
            this.usersList = usersData.data || [];

            // Associate profiles with users
            for (let user of this.usersList) {
                const profile = this.allProfiles.find(p => p.id === user.id);
                user.profile = profile || undefined;
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this._displaySnackbar('Error al cargar los usuarios.');
        }
    }

    public async deleteEnemy(enemy: Enemy): Promise<void> {
        if (confirm(`¿Estás seguro de que deseas eliminar a ${enemy.name}?`)) {
            try {
                await this._supabaseService.deleteEnemy(enemy.id);
                this.enemiesList = this.enemiesList.filter(e => e.id !== enemy.id);
                this.enemiesListToStartBattle = this.enemiesListToStartBattle.filter(e => e.id !== enemy.id);
                this._displaySnackbar(`${enemy.name} ha sido eliminado correctamente.`);
            } catch (error) {
                console.error('Error deleting enemy:', error);
                this._displaySnackbar('Error al eliminar el enemigo. Inténtalo de nuevo.');
            }
        }
    }

    public async startBattle(): Promise<void> {
        if (this.enemiesListToStartBattle.length > 0) {
            this._executeSupabaseRealtimeEvent();
            this._displaySnackbar('¡Combate iniciado! Los jugadores han sido notificados.');
        } else {
            this._displaySnackbar('Por favor, selecciona al menos un enemigo para empezar el combate.');
        }
    }

    public addEnemyToBattle(enemy: Enemy): void {
        if (enemy) {
            // Check if enemy is already in battle list
            if (!this.enemiesListToStartBattle.some(e => e.id === enemy.id)) {
                this.enemiesListToStartBattle.push(enemy);
                this._displaySnackbar(`${enemy.name} añadido al combate.`);
            } else {
                this._displaySnackbar(`${enemy.name} ya está en la lista de combate.`);
            }
        }

        this.noEnemies = this.enemiesListToStartBattle.length === 0;
    }

    private _displaySnackbar(message: string): void {
        this._snackBar.open(message, 'Cerrar', {
            duration: 4000,
        });
    }

    private async _executeSupabaseRealtimeEvent(): Promise<void> {
        this.battleChannel = await this._supabaseService.getBroadcastBattleChannel();

        this.battleChannel.send({
            type: 'broadcast',
            event: 'test',
            payload: { message: 'start', enemies: this.enemiesListToStartBattle },
        });
    }

    public signOut(): void {
        this._userService.clearUser();
        this._supabaseService.signOut();

        this._displaySnackbar('Sesión cerrada correctamente.');
        this._router.navigate(['']);
    }

    // New methods for enhanced DM dashboard
    public switchTab(tabName: string): void {
        if (tabName === 'enemies' || tabName === 'npcs' || tabName === 'quests' || tabName === 'users') {
            this.currentTab = tabName;
        }
    }

    public clearBattleList(): void {
        this.enemiesListToStartBattle = [];
        this.noEnemies = true;
        this._displaySnackbar('Lista de combate limpiada.');
    }

    public removeEnemyFromBattle(enemy: Enemy): void {
        this.enemiesListToStartBattle = this.enemiesListToStartBattle.filter(e => e.id !== enemy.id);
        this.noEnemies = this.enemiesListToStartBattle.length === 0;
        this._displaySnackbar(`${enemy.name} eliminado de la lista de combate.`);
    }

    public openCreateEnemyDialog(): void {
        // Temporarily disabled
        this._displaySnackbar('Funcionalidad de crear enemigo en desarrollo.');
    }

    public editEnemy(enemy: Enemy): void {
        // Temporarily disabled
        this._displaySnackbar('Funcionalidad de editar enemigo en desarrollo.');
    }

    public async deleteNPC(npc: NPC): Promise<void> {
        if (confirm(`¿Estás seguro de que deseas eliminar a ${npc.name}?`)) {
            try {
                await this._supabaseService.deleteNPC(npc.id);
                this.npcsList = this.npcsList.filter(n => n.id !== npc.id);
                this._displaySnackbar(`${npc.name} ha sido eliminado correctamente.`);
            } catch (error) {
                console.error('Error deleting NPC:', error);
                this._displaySnackbar('Error al eliminar el NPC. Inténtalo de nuevo.');
            }
        }
    } public async createNPC(): Promise<void> {
        const dialogRef = this._dialog.open(NPCDialogComponent, {
            width: '95vw', // Usar viewport width para mejor responsividad
            maxWidth: '1200px', // Ancho máximo para pantallas grandes
            maxHeight: '90vh',
            disableClose: false,
            autoFocus: false,
            panelClass: 'npc-dialog-panel'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // NPC was created, reload the data
                this._loadData();
                this._displaySnackbar(`NPC "${result.name}" creado correctamente.`);
            }
        });
    } public editNPC(npc: NPC): void {
        const dialogRef = this._dialog.open(NPCDialogComponent, {
            width: '95vw', // Usar viewport width para mejor responsividad
            maxWidth: '1200px', // Ancho máximo para pantallas grandes
            maxHeight: '90vh',
            disableClose: false,
            autoFocus: false,
            panelClass: 'npc-dialog-panel',
            data: { npc }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // NPC was updated, reload the data
                this._loadData();
                this._displaySnackbar(`NPC "${result.name}" actualizado correctamente.`);
            }
        });
    }

    // Mission methods
    public openMissionForm(): void {
        const dialogRef = this._dialog.open(MissionDialogComponent, {
            data: {
                mission: null,
                profiles: this.profilesList
            },
            width: '900px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            disableClose: false
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._displaySnackbar(`Misión "${result.title}" creada correctamente.`);
                this._loadData();
            }
        });
    }

    public editMission(mission: Mission): void {
        const dialogRef = this._dialog.open(MissionDialogComponent, {
            data: {
                mission: mission,
                profiles: this.profilesList
            },
            width: '900px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            disableClose: false
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._displaySnackbar(`Misión "${result.title}" actualizada correctamente.`);
                this._loadData();
            }
        });
    }

    public async deleteMission(mission: Mission): Promise<void> {
        if (confirm(`¿Estás seguro de que deseas eliminar la misión "${mission.title}"?`)) {
            try {
                await this._supabaseService.deleteMission(mission.id!);
                this.missionsList = this.missionsList.filter(m => m.id !== mission.id);
                this._displaySnackbar(`Misión "${mission.title}" eliminada correctamente.`);
            } catch (error) {
                console.error('Error deleting mission:', error);
                this._displaySnackbar('Error al eliminar la misión. Inténtalo de nuevo.');
            }
        }
    }

    public getDifficultyColor(difficulty: string): string {
        switch (difficulty) {
            case 'easy': return '#4CAF50';
            case 'medium': return '#FF9800';
            case 'hard': return '#F44336';
            case 'legendary': return '#9C27B0';
            default: return '#757575';
        }
    }

    public getStatusColor(status: string): string {
        switch (status) {
            case 'pending': return '#757575';
            case 'in_progress': return '#2196F3';
            case 'completed': return '#4CAF50';
            case 'failed': return '#F44336';
            default: return '#757575';
        }
    }

    // Mission assignment methods
    public openAssignmentModal(mission: Mission): void {
        this.selectedMissionForAssignment = mission;
        this.selectedProfileId = mission.assigned_to || '';
        this.showAssignmentModal = true;
    }

    public async assignMissionToProfile(): Promise<void> {
        if (this.selectedMissionForAssignment && this.selectedProfileId) {
            try {
                const result = await this._supabaseService.assignMissionToProfile(
                    this.selectedMissionForAssignment.id!,
                    this.selectedProfileId
                );

                if (result.data) {
                    const selectedProfile = this.profilesList.find(p => p.id === this.selectedProfileId);
                    const profileName = selectedProfile?.username || 'Jugador';
                    this._displaySnackbar(`Misión "${this.selectedMissionForAssignment.title}" asignada a ${profileName}.`);

                    this.closeAssignmentModal();
                    await this._loadData();
                }
            } catch (error) {
                console.error('Error assigning mission:', error);
                this._displaySnackbar('Error al asignar la misión. Inténtalo de nuevo.');
            }
        } else {
            this._displaySnackbar('Por favor, selecciona un perfil para asignar la misión.');
        }
    }

    public async unassignMission(mission: Mission): Promise<void> {
        if (confirm(`¿Estás seguro de que deseas desasignar la misión "${mission.title}"?`)) {
            try {
                const result = await this._supabaseService.updateMission({
                    ...mission,
                    assigned_to: undefined,
                    status: 'pending'
                });

                if (result.data) {
                    this._displaySnackbar(`Misión "${mission.title}" desasignada correctamente.`);
                    await this._loadData();
                }
            } catch (error) {
                console.error('Error unassigning mission:', error);
                this._displaySnackbar('Error al desasignar la misión. Inténtalo de nuevo.');
            }
        }
    }

    public closeAssignmentModal(): void {
        this.showAssignmentModal = false;
        this.selectedMissionForAssignment = null;
        this.selectedProfileId = '';
    }

    public getAssignedProfileName(profileId: string): string {
        const profile = this.profilesList.find(p => p.id === profileId);
        return profile?.username || 'Usuario desconocido';
    }

    // User management methods
    public async deleteUser(user: UserReplica & { profile?: Profile }): Promise<void> {
        const userName = user.profile?.username || user.email;
        if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${userName}? Esta acción no se puede deshacer.`)) {
            try {
                const result = await this._supabaseService.deleteUser(user.id);
                if (result.error) {
                    throw result.error;
                }

                this.usersList = this.usersList.filter(u => u.id !== user.id);
                this._displaySnackbar(`Usuario ${userName} eliminado correctamente.`);
            } catch (error) {
                console.error('Error deleting user:', error);
                this._displaySnackbar('Error al eliminar el usuario. Inténtalo de nuevo.');
            }
        }
    }

    public openCreateProfileModal(user: UserReplica & { profile?: Profile }): void {
        this.selectedUserForProfile = user;
        this.showUserProfileModal = true;
    } public closeUserProfileModal(): void {
        this.showUserProfileModal = false;
        this.selectedUserForProfile = null;
    }

    public async createProfileForUser(profileData: Partial<Profile>): Promise<void> {
        if (!this.selectedUserForProfile) return;

        try {
            const newProfile = {
                ...profileData,
                id: this.selectedUserForProfile.id
            };

            const result = await this._supabaseService.createProfile(newProfile);
            if (result.error) {
                throw result.error;
            }

            this._displaySnackbar(`Perfil creado correctamente para ${this.selectedUserForProfile.email}.`);
            this.closeUserProfileModal();
            await this._loadData();
        } catch (error) {
            console.error('Error creating profile:', error);
            this._displaySnackbar('Error al crear el perfil. Inténtalo de nuevo.');
        }
    }

    public formatUserDate(dateString: string): string {
        if (!dateString) return '';

        const date = new Date(dateString);
        
        // The date must be in the format dd-MM-yyyy HH:mm:ss
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

    public getUserStatus(user: UserReplica): string {
        if (user.email_confirmed_at) {
            return 'Verificado';
        }
        return 'Sin verificar';
    }

    public editUserProfile(user: UserReplica & { profile?: Profile }): void {
        // TODO: Implement profile editing modal
        this._displaySnackbar('Funcionalidad de edición de perfil en desarrollo.');
    }

    public ngOnDestroy(): void {
        if (this.battleChannel) {
            this.battleChannel.unsubscribe();
        }
    }
}