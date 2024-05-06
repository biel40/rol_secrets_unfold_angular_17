import { Component, inject, OnInit } from '@angular/core';
import { Profile, Enemy, SupabaseService } from '../../../services/supabase/supabase.service';
import { UserService } from '../../../services/user/user.service';
import { RealtimeChannel, User } from '@supabase/supabase-js';
import { MaterialModule } from '../../../modules/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    standalone: true,
    imports: [
        MaterialModule
    ]
})
export class AdminComponent implements OnInit {

    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _userService = inject(UserService);
    private _snackBar = inject(MatSnackBar);
    private _router = inject(Router);

    public user: User | null = null;
    public profile: Profile | null = null;
    public battleChannel: RealtimeChannel | null = null;

    public noEnemies: boolean = true;
    public enemiesList: Enemy[] = [];
    public enemiesListToStartBattle: Enemy[] = [];

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

        console.log('enemies List from SUpabase DB: ', this.enemiesList);
    }

    public async deleteEnemy(enemy: Enemy): Promise<void> {
    }

    public async startBattle() : Promise<void> {
        if (this.enemiesListToStartBattle.length > 0) {
            console.log('Battle started with enemies: ', this.enemiesListToStartBattle);
            this._executeSupabaseRealtimeEvent();
        } else {
            this._displaySnackbar('Por favor, selecciona almenos un enemigo para empezar el combate.');
        }
    }

    public addEnemyToBattle(enemy: Enemy) : void {
        if (enemy) {
            this.enemiesListToStartBattle.push(enemy);
        }

        this.noEnemies = false;
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
            payload: { message: 'start' },
        });
    }

    public signOut() : void {
        this._userService.clearUser();
        this._supabaseService.signOut();

        this._displaySnackbar('Sesión cerrada correctamente.');
        this._router.navigate(['']);
    }

    public ngOnDestroy(): void {
    }

}