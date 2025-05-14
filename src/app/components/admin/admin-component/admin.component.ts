import { Component, inject, OnInit } from '@angular/core';
import { Profile, Enemy, SupabaseService } from '../../../services/supabase/supabase.service';
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
    
    // New properties for enhanced DM dashboard
    public currentTab: string = 'enemies';
    public searchTerm: string = '';
    
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

    public async startBattle() : Promise<void> {
        if (this.enemiesListToStartBattle.length > 0) {
            console.log('Battle started with enemies: ', this.enemiesListToStartBattle);
            this._executeSupabaseRealtimeEvent();
            this._displaySnackbar('¡Combate iniciado! Los jugadores han sido notificados.');
        } else {
            this._displaySnackbar('Por favor, selecciona al menos un enemigo para empezar el combate.');
        }
    }

    public addEnemyToBattle(enemy: Enemy) : void {
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

    private _displaySnackbar(message: string) : void {
        this._snackBar.open(message, 'Cerrar', {
          duration: 4000,
        });
    }

    private async _executeSupabaseRealtimeEvent() : Promise<void> {
        this.battleChannel = await this._supabaseService.getBroadcastBattleChannel();

        this.battleChannel.send({
            type: 'broadcast',
            event: 'test',
            payload: { message: 'start', enemies: this.enemiesListToStartBattle},
        });
    }

    public signOut() : void {
        this._userService.clearUser();
        this._supabaseService.signOut();

        this._displaySnackbar('Sesión cerrada correctamente.');
        this._router.navigate(['']);
    }

    // New methods for enhanced DM dashboard
    public switchTab(tabName: string): void {
        this.currentTab = tabName;
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
        // This would normally open a dialog to create a new enemy
        // For now, we'll just show a message
        this._displaySnackbar('Funcionalidad de crear enemigo en desarrollo.');
    }
    
    public editEnemy(enemy: Enemy): void {
        // This would normally open a dialog to edit the enemy
        // For now, we'll just show a message
        this._displaySnackbar(`Edición de ${enemy.name} en desarrollo.`);
    }
    
    public ngOnDestroy(): void {
        if (this.battleChannel) {
            this.battleChannel.unsubscribe();
        }
    }

}