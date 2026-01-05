import { Injectable, inject, signal, computed } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { 
    SupabaseService, 
    Enemy, 
    NPC, 
    Mission, 
    Profile, 
    ProfileSummary, 
    Hability, 
    UserReplica 
} from '../supabase/supabase.service';

@Injectable({
    providedIn: 'root'
})
export class AdminStateService {
    private _supabaseService = inject(SupabaseService);
    private _snackBar = inject(MatSnackBar);

    // Enemies
    public readonly enemies = signal<Enemy[]>([]);
    public readonly enemiesLoading = signal<boolean>(false);
    public readonly battleList = signal<Enemy[]>([]);
    public readonly enemySearchTerm = signal<string>('');
    public readonly enemyLevelFilter = signal<string>('');
    public readonly enemyBossFilter = signal<string>('');

    // NPCs
    public readonly npcs = signal<NPC[]>([]);
    public readonly npcSearchTerm = signal<string>('');

    // Missions
    public readonly missions = signal<Mission[]>([]);
    public readonly missionSearchTerm = signal<string>('');

    // Users
    public readonly users = signal<(UserReplica & { profile?: Profile })[]>([]);
    public readonly usersLoading = signal<boolean>(false);
    public readonly userSearchTerm = signal<string>('');

    // Habilities
    public readonly habilities = signal<Hability[]>([]);
    public readonly habilitiesLoading = signal<boolean>(false);
    public readonly habilitySearchTerm = signal<string>('');
    public readonly habilityPowerFilter = signal<string>('');
    public readonly habilityProfileFilter = signal<string>('');
    public readonly habilityAssociations = signal<Map<string, string[]>>(new Map());

    // Profiles (shared data)
    public readonly profiles = signal<ProfileSummary[]>([]);
    public readonly allProfiles = signal<Profile[]>([]);

    public readonly filteredEnemies = computed(() => {
        let list = this.enemies();

        // Filter by boss type
        const bossFilter = this.enemyBossFilter();
        if (bossFilter.trim()) {
            const isBoss = bossFilter === 'boss';
            list = list.filter(enemy => enemy.is_boss === isBoss);
        }

        // Filter by level range
        const levelFilter = this.enemyLevelFilter();
        if (levelFilter.trim()) {
            const [minLevel, maxLevel] = levelFilter.split('-').map(Number);
            list = list.filter(enemy => {
                if (maxLevel) {
                    return enemy.level >= minLevel && enemy.level <= maxLevel;
                }
                return enemy.level >= minLevel;
            });
        }

        // Filter by search term
        const term = this.enemySearchTerm().toLowerCase().trim();
        if (term) {
            list = list.filter(enemy =>
                enemy.name.toLowerCase().includes(term) ||
                (enemy.description?.toLowerCase().includes(term)) ||
                (enemy.level?.toString().includes(term))
            );
        }

        return list;
    });

    public readonly filteredNPCs = computed(() => {
        const term = this.npcSearchTerm().toLowerCase().trim();
        if (!term) return this.npcs();

        return this.npcs().filter(npc =>
            npc.name.toLowerCase().includes(term) ||
            (npc.description?.toLowerCase().includes(term))
        );
    });

    public readonly filteredMissions = computed(() => {
        const term = this.missionSearchTerm().toLowerCase().trim();
        if (!term) return this.missions();

        return this.missions().filter(mission =>
            mission.title.toLowerCase().includes(term) ||
            (mission.description?.toLowerCase().includes(term)) ||
            mission.status.toLowerCase().includes(term) ||
            mission.difficulty.toLowerCase().includes(term)
        );
    });

    public readonly filteredUsers = computed(() => {
        const term = this.userSearchTerm().toLowerCase().trim();
        if (!term) return this.users();

        return this.users().filter(user =>
            user.email.toLowerCase().includes(term) ||
            (user.user_metadata?.full_name?.toLowerCase().includes(term)) ||
            (user.profile?.username?.toLowerCase().includes(term))
        );
    });

    public readonly filteredHabilities = computed(() => {
        let list = this.habilities();

        // Filter by power type
        const powerFilter = this.habilityPowerFilter();
        if (powerFilter.trim()) {
            list = list.filter(h => h.power.toLowerCase() === powerFilter.toLowerCase());
        }

        // Filter by profile
        const profileFilter = this.habilityProfileFilter();
        if (profileFilter.trim()) {
            const associations = this.habilityAssociations();
            list = list.filter(h => {
                if (!h.id) return false;
                const associated = associations.get(h.id) || [];
                return associated.includes(profileFilter);
            });
        }

        // Filter by search term
        const term = this.habilitySearchTerm().toLowerCase().trim();
        if (term) {
            list = list.filter(h =>
                h.name?.toLowerCase().includes(term) ||
                h.description?.toLowerCase().includes(term) ||
                h.clase.toLowerCase().includes(term) ||
                h.power.toLowerCase().includes(term)
            );
        }

        return list;
    });

    public readonly availablePowerTypes = computed(() => {
        const types = this.habilities().map(h => h.power);
        return [...new Set(types)].sort();
    });

    public readonly activeEnemyFiltersCount = computed(() => {
        let count = 0;
        if (this.enemySearchTerm().trim()) count++;
        if (this.enemyLevelFilter().trim()) count++;
        if (this.enemyBossFilter().trim()) count++;
        return count;
    });

    public readonly activeHabilityFiltersCount = computed(() => {
        let count = 0;
        if (this.habilitySearchTerm().trim()) count++;
        if (this.habilityPowerFilter().trim()) count++;
        if (this.habilityProfileFilter().trim()) count++;
        return count;
    });

    public readonly hasBattleEnemies = computed(() => this.battleList().length > 0);

    public readonly levelRanges: { value: string, label: string }[] = [
        { value: '1-5', label: 'Nivel 1-5' },
        { value: '6-10', label: 'Nivel 6-10' },
        { value: '11-20', label: 'Nivel 11-20' },
        { value: '21-50', label: 'Nivel 21-50' },
        { value: '51', label: 'Nivel 51+' }
    ];

    public readonly bossFilterOptions: { value: string, label: string }[] = [
        { value: 'boss', label: 'Solo Jefes' },
        { value: 'normal', label: 'Solo Normales' }
    ];

    public async loadAllData(): Promise<void> {
        const [enemiesResult, npcsResult, missionsResult, profilesResult, detailedProfiles] = await Promise.all([
            this._supabaseService.getEnemies(),
            this._supabaseService.getNPCs(),
            this._supabaseService.getMissions(),
            this._supabaseService.getAllProfiles(),
            this._supabaseService.getAllProfilesDetailed()
        ]);

        this.enemies.set((enemiesResult.data as Enemy[]) || []);
        this.npcs.set((npcsResult.data as NPC[]) || []);
        this.missions.set((missionsResult.data as Mission[]) || []);
        this.profiles.set((profilesResult.data as ProfileSummary[]) || []);
        this.allProfiles.set((detailedProfiles.data as Profile[]) || []);

        await this.loadUsers();
    }

    public async loadUsers(): Promise<void> {
        this.usersLoading.set(true);
        try {
            const usersData = await this._supabaseService.getAllUsers();
            const usersList: (UserReplica & { profile?: Profile })[] = usersData.data || [];
            const allProfilesList = this.allProfiles();

            // Associate profiles with users
            for (let user of usersList) {
                let profile = allProfilesList.find(p => p.id === user.id);
                user.profile = profile || undefined;
            }

            this.users.set(usersList);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showSnackbar('Error al cargar los usuarios.');
        } finally {
            this.usersLoading.set(false);
        }
    }

    public async loadHabilities(): Promise<void> {
        this.habilitiesLoading.set(true);
        try {
            const { habilities, associations } = await this._supabaseService.getAllHabilitiesWithAssociations();
            this.habilities.set(habilities);
            this.habilityAssociations.set(associations);
        } catch (error) {
            console.error('Error loading habilities:', error);
            this.showSnackbar('Error al cargar las habilidades.');
        } finally {
            this.habilitiesLoading.set(false);
        }
    }

    public addEnemyToBattle(enemy: Enemy): void {
        const current = this.battleList();
        if (!current.some(e => e.id === enemy.id)) {
            this.battleList.set([...current, enemy]);
            this.showSnackbar(`${enemy.name} añadido al combate.`);
        } else {
            this.showSnackbar(`${enemy.name} ya está en la lista de combate.`);
        }
    }

    public removeEnemyFromBattle(enemy: Enemy): void {
        this.battleList.set(this.battleList().filter(e => e.id !== enemy.id));
        this.showSnackbar(`${enemy.name} eliminado de la lista de combate.`);
    }

    public clearBattleList(): void {
        this.battleList.set([]);
        this.showSnackbar('Lista de combate limpiada.');
    }

    public clearEnemyFilters(): void {
        this.enemySearchTerm.set('');
        this.enemyLevelFilter.set('');
        this.enemyBossFilter.set('');
    }

    public async deleteEnemy(enemy: Enemy): Promise<boolean> {
        try {
            await this._supabaseService.deleteEnemy(enemy.id);
            this.enemies.set(this.enemies().filter(e => e.id !== enemy.id));
            this.battleList.set(this.battleList().filter(e => e.id !== enemy.id));
            this.showSnackbar(`${enemy.name} ha sido eliminado correctamente.`);
            return true;
        } catch (error) {
            console.error('Error deleting enemy:', error);
            this.showSnackbar('Error al eliminar el enemigo. Inténtalo de nuevo.');
            return false;
        }
    }

    public async createEnemy(enemyData: Partial<Enemy>): Promise<Enemy | null> {
        try {
            const result = await this._supabaseService.createEnemy(enemyData as Enemy);
            if (result.error) {
                this.showSnackbar('Error al crear el enemigo.');
                return null;
            }
            this.enemies.set([...this.enemies(), result.data]);
            this.showSnackbar('Enemigo creado correctamente.');
            return result.data;
        } catch (error) {
            console.error('Error creating enemy:', error);
            this.showSnackbar('Error al crear el enemigo.');
            return null;
        }
    }

    public async updateEnemy(enemyData: Enemy): Promise<Enemy | null> {
        try {
            const result = await this._supabaseService.updateEnemy(enemyData);
            if (result.error) {
                this.showSnackbar('Error al actualizar el enemigo.');
                return null;
            }
            this.enemies.update(list => 
                list.map(e => e.id === result.data.id ? result.data : e)
            );
            this.showSnackbar('Enemigo actualizado correctamente.');
            return result.data;
        } catch (error) {
            console.error('Error updating enemy:', error);
            this.showSnackbar('Error al actualizar el enemigo.');
            return null;
        }
    }

    public async deleteNPC(npc: NPC): Promise<boolean> {
        try {
            await this._supabaseService.deleteNPC(npc.id);
            this.npcs.set(this.npcs().filter(n => n.id !== npc.id));
            this.showSnackbar(`${npc.name} ha sido eliminado correctamente.`);
            return true;
        } catch (error) {
            console.error('Error deleting NPC:', error);
            this.showSnackbar('Error al eliminar el NPC. Inténtalo de nuevo.');
            return false;
        }
    }

    public async refreshNPCs(): Promise<void> {
        const result = await this._supabaseService.getNPCs();
        this.npcs.set((result.data as NPC[]) || []);
    }

    public async deleteMission(mission: Mission): Promise<boolean> {
        try {
            await this._supabaseService.deleteMission(mission.id!);
            this.missions.set(this.missions().filter(m => m.id !== mission.id));
            this.showSnackbar(`Misión "${mission.title}" eliminada correctamente.`);
            return true;
        } catch (error) {
            console.error('Error deleting mission:', error);
            this.showSnackbar('Error al eliminar la misión. Inténtalo de nuevo.');
            return false;
        }
    }

    public async assignMission(missionId: number, profileId: string): Promise<boolean> {
        try {
            const result = await this._supabaseService.assignMissionToProfile(missionId, profileId);
            if (result.data) {
                await this.loadAllData();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error assigning mission:', error);
            this.showSnackbar('Error al asignar la misión. Inténtalo de nuevo.');
            return false;
        }
    }

    public async unassignMission(mission: Mission): Promise<boolean> {
        try {
            const result = await this._supabaseService.updateMission({
                ...mission,
                assigned_to: undefined,
                status: 'pending'
            });
            if (result.data) {
                await this.loadAllData();
                this.showSnackbar(`Misión "${mission.title}" desasignada correctamente.`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error unassigning mission:', error);
            this.showSnackbar('Error al desasignar la misión. Inténtalo de nuevo.');
            return false;
        }
    }

    public async refreshMissions(): Promise<void> {
        const result = await this._supabaseService.getMissions();
        this.missions.set((result.data as Mission[]) || []);
    }

    public async deleteUser(user: UserReplica & { profile?: Profile }): Promise<boolean> {
        this.usersLoading.set(true);
        try {
            const result = await this._supabaseService.deleteUser(user.id);
            if (result.error) throw result.error;

            this.users.set(this.users().filter(u => u.id !== user.id));
            const userName = user.profile?.username || user.email;
            this.showSnackbar(`Usuario ${userName} eliminado correctamente.`);
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showSnackbar('Error al eliminar el usuario. Inténtalo de nuevo.');
            return false;
        } finally {
            this.usersLoading.set(false);
        }
    }

    public async createProfileForUser(userId: string, profileData: Partial<Profile>): Promise<boolean> {
        this.usersLoading.set(true);
        try {
            const newProfile = { ...profileData, id: userId };
            const result = await this._supabaseService.createProfile(newProfile);
            if (result.error) throw result.error;

            await this.loadAllData();
            this.showSnackbar('Perfil creado correctamente.');
            return true;
        } catch (error) {
            console.error('Error creating profile:', error);
            this.showSnackbar('Error al crear el perfil. Inténtalo de nuevo.');
            return false;
        } finally {
            this.usersLoading.set(false);
        }
    }

    public clearHabilityFilters(): void {
        this.habilitySearchTerm.set('');
        this.habilityPowerFilter.set('');
        this.habilityProfileFilter.set('');
    }

    public async createHability(habilityData: Hability, associatedProfiles: string[] = []): Promise<Hability | null> {
        try {
            const result = await this._supabaseService.createHability(habilityData);
            if (result.error) {
                this.showSnackbar('Error al crear la habilidad.');
                return null;
            }

            // Associate with profiles if provided
            if (associatedProfiles.length > 0 && result.data) {
                await this._supabaseService.associateHabilityWithProfiles(
                    result.data.id,
                    associatedProfiles
                );
            }

            await this.loadHabilities();
            this.showSnackbar('Habilidad creada correctamente.');
            return result.data;
        } catch (error) {
            console.error('Error creating hability:', error);
            this.showSnackbar('Error al crear la habilidad.');
            return null;
        }
    }

    public async updateHability(habilityData: Hability, associatedProfiles: string[] = []): Promise<boolean> {
        try {
            await this._supabaseService.updateHability(habilityData);

            if (habilityData.id) {
                await this._supabaseService.associateHabilityWithProfiles(
                    habilityData.id,
                    associatedProfiles
                );
            }

            this.habilities.update(list =>
                list.map(h => h.id === habilityData.id ? habilityData : h)
            );
            this.showSnackbar('Habilidad actualizada correctamente.');
            return true;
        } catch (error) {
            console.error('Error updating hability:', error);
            this.showSnackbar('Error al actualizar la habilidad.');
            return false;
        }
    }

    public async deleteHability(hability: Hability): Promise<boolean> {
        try {
            const result = await this._supabaseService.deleteHability(hability.id!);
            if (result.error) {
                this.showSnackbar('Error al eliminar la habilidad.');
                return false;
            }

            this.habilities.set(this.habilities().filter(h => h.id !== hability.id));
            this.showSnackbar('Habilidad eliminada correctamente.');
            return true;
        } catch (error) {
            console.error('Error deleting hability:', error);
            this.showSnackbar('Error al eliminar la habilidad.');
            return false;
        }
    }

    public updateHabilityAssociations(habilityId: string, profileIds: string[]): void {
        const current = new Map(this.habilityAssociations());
        current.set(habilityId, profileIds);
        this.habilityAssociations.set(current);
    }

    public getProfileName(profileId: string): string {
        const profile = this.profiles().find(p => p.id === profileId);
        return profile?.username || 'Usuario desconocido';
    }

    public getAssociatedProfileNames(habilityId: string | undefined): string[] {
        if (!habilityId) return [];
        const ids = this.habilityAssociations().get(habilityId) || [];
        return ids.map(id => this.getProfileName(id));
    }

    public formatDate(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    public getUserStatus(user: UserReplica): string {
        return user.email_confirmed_at ? 'Verificado' : 'Sin verificar';
    }

    public getDifficultyColor(difficulty: string): string {
        const colors: Record<string, string> = {
            'easy': '#4CAF50',
            'medium': '#FF9800',
            'hard': '#F44336',
            'legendary': '#9C27B0'
        };
        return colors[difficulty] || '#757575';
    }

    public getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            'pending': '#757575',
            'in_progress': '#2196F3',
            'completed': '#4CAF50',
            'failed': '#F44336'
        };
        return colors[status] || '#757575';
    }

    public getPowerTheme(powerType: string): { icon: string, color: string, bgColor: string } {
        const normalized = powerType?.trim().toLowerCase();
        const themes: Record<string, { icon: string, color: string, bgColor: string }> = {
            'pyro': { icon: '🔥', color: '#e74c3c', bgColor: 'rgba(231, 76, 60, 0.1)' },
            'hydro': { icon: '💧', color: '#3498db', bgColor: 'rgba(52, 152, 219, 0.1)' },
            'geo': { icon: '🪨', color: '#8b4513', bgColor: 'rgba(139, 69, 19, 0.1)' },
            'electro': { icon: '⚡', color: '#9b59b6', bgColor: 'rgba(155, 89, 182, 0.1)' },
            'cryo': { icon: '❄️', color: '#74b9ff', bgColor: 'rgba(116, 185, 255, 0.1)' },
            'natura': { icon: '🌿', color: '#27ae60', bgColor: 'rgba(39, 174, 96, 0.1)' },
            'aero': { icon: '🌪️', color: '#00cec9', bgColor: 'rgba(0, 206, 201, 0.1)' },
            'light': { icon: '✨', color: '#f39c12', bgColor: 'rgba(243, 156, 18, 0.1)' },
            'dark': { icon: '🌑', color: '#2c3e50', bgColor: 'rgba(44, 62, 80, 0.1)' },
            'universal': { icon: '🌌', color: '#8e44ad', bgColor: 'rgba(142, 68, 173, 0.1)' }
        };
        return themes[normalized] || { icon: '⭐', color: '#95a5a6', bgColor: 'rgba(149, 165, 166, 0.1)' };
    }

    public showSnackbar(message: string, duration = 4000): void {
        this._snackBar.open(message, 'Cerrar', { duration });
    }
}
