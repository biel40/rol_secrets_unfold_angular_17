import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { User } from '@supabase/supabase-js';

import { MaterialModule } from '../../../modules/material.module';
import { LocaleChangerComponent } from '../../locale-changer/locale-changer.component';
import { EnemiesTabComponent } from '../enemies-tab/enemies-tab.component';
import { UsersTabComponent } from '../users-tab/users-tab.component';
import { HabilitiesTabComponent } from '../habilities-tab/habilities-tab.component';
import { AdminStateService } from '../../../services/admin/admin-state.service';
import { SupabaseService, Profile, Enemy } from '../../../services/supabase/supabase.service';
import { UserService } from '../../../services/user/user.service';
import { LoaderService } from '../../../services/loader/loader.service';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MaterialModule,
        TranslocoModule,
        LocaleChangerComponent,
        EnemiesTabComponent,
        UsersTabComponent,
        HabilitiesTabComponent
    ]
})
export class AdminComponent implements OnInit, OnDestroy {
    private readonly _supabaseService = inject(SupabaseService);
    private readonly _userService = inject(UserService);
    private readonly _loaderService = inject(LoaderService);
    private readonly _router = inject(Router);
    public readonly state = inject(AdminStateService);

    public readonly user = signal<User | null>(null);
    public readonly profile = signal<Profile | null>(null);
    public readonly currentTab = signal<'enemies' | 'npcs' | 'quests' | 'users' | 'habilities'>('enemies');

    public async ngOnInit(): Promise<void> {
        this._loaderService.setLoading(false);
        
        const currentUser = this._userService.getUser();
        this.user.set(currentUser);

        if (currentUser) {
            const profileResult = await this._supabaseService.getProfileInfo(currentUser.id);
            if (profileResult.data) {
                this.profile.set(profileResult.data);
            }
        }

        await this.state.loadAllData();
    }

    public ngOnDestroy(): void {
        this._loaderService.setLoading(false);
    }

    public switchTab(tabName: 'enemies' | 'npcs' | 'quests' | 'users' | 'habilities'): void {
        this.currentTab.set(tabName);
    }

    public async signOut(): Promise<void> {
        await this._userService.signOut();
        this.state.showSnackbar('Sesión cerrada correctamente.');
        this._router.navigate(['']);
    }

    public onBattleStarted(enemies: Enemy[]): void {
        // Lógica adicional cuando inicia una batalla
    }
}
