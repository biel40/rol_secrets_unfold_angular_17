import { Component, inject, OnDestroy, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoModule } from '@jsverse/transloco';
import { RealtimeChannel } from '@supabase/supabase-js';
import { MaterialModule } from '../../../modules/material.module';
import { AdminStateService } from '../../../services/admin/admin-state.service';
import { Enemy, SupabaseService } from '../../../services/supabase/supabase.service';
import { EnemyDialogComponent } from '../../dialogs/enemy-dialog/enemy-dialog.component';

@Component({
    selector: 'app-enemies-tab',
    standalone: true,
    imports: [CommonModule, FormsModule, MaterialModule, TranslocoModule],
    templateUrl: './enemies-tab.component.html',
    styleUrls: ['./enemies-tab.component.scss']
})
export class EnemiesTabComponent implements OnInit, OnDestroy {
    public readonly state = inject(AdminStateService);
    private readonly _dialog = inject(MatDialog);
    private readonly _supabaseService = inject(SupabaseService);

    public readonly battleStarted = output<Enemy[]>();
    private _battleChannel: RealtimeChannel | null = null;

    public ngOnInit(): void {}

    public openCreateEnemyDialog(): void {
        const dialogRef = this._dialog.open(EnemyDialogComponent, {
            data: {},
            width: 'min(90vw, 900px)',
            minWidth: '320px',
            maxWidth: '900px',
            maxHeight: '95vh',
            disableClose: false,
            autoFocus: false,
            panelClass: 'enemy-dialog-panel'
        });

        dialogRef.afterClosed().subscribe(async (result) => {
            if (result) {
                await this.state.createEnemy(result);
            }
        });
    }

    public editEnemy(enemy: Enemy): void {
        const dialogRef = this._dialog.open(EnemyDialogComponent, {
            data: { enemy },
            width: 'min(90vw, 900px)',
            minWidth: '320px',
            maxWidth: '900px',
            maxHeight: '95vh',
            disableClose: false,
            autoFocus: false,
            panelClass: 'enemy-dialog-panel'
        });

        dialogRef.afterClosed().subscribe(async (result) => {
            if (result) {
                await this.state.updateEnemy(result);
            }
        });
    }

    public async deleteEnemy(enemy: Enemy): Promise<void> {
        if (confirm(`¿Estás seguro de que deseas eliminar a ${enemy.name}?`)) {
            await this.state.deleteEnemy(enemy);
        }
    }

    public addToBattle(enemy: Enemy): void {
        this.state.addEnemyToBattle(enemy);
    }

    public removeFromBattle(enemy: Enemy): void {
        this.state.removeEnemyFromBattle(enemy);
    }

    public clearBattle(): void {
        this.state.clearBattleList();
    }

    public async startBattle(): Promise<void> {
        const battleEnemies = this.state.battleList();
        
        if (battleEnemies.length > 0) {
            await this._executeBroadcast(battleEnemies);
            this.state.showSnackbar('¡Combate iniciado! Los jugadores han sido notificados.');
            this.battleStarted.emit(battleEnemies);
        } else {
            this.state.showSnackbar('Por favor, selecciona al menos un enemigo para empezar el combate.');
        }
    }

    private async _executeBroadcast(enemies: Enemy[]): Promise<void> {
        this._battleChannel = await this._supabaseService.getBroadcastBattleChannel();
        this._battleChannel.send({
            type: 'broadcast',
            event: 'test',
            payload: { message: 'start', enemies }
        });
    }

    public clearFilters(): void {
        this.state.clearEnemyFilters();
    }

    public ngOnDestroy(): void {
        this._battleChannel?.unsubscribe();
    }
}
