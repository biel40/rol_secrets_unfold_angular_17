import { Component, inject, OnInit } from '@angular/core';
import { Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { User } from '@supabase/supabase-js';
import { UserService } from '../../services/user/user.service';
import { LoaderService } from '../../services/loader/loader.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../modules/material.module';
import { ProfileStatsComponent } from '../profile-stats/profile-stats.component';
import { HabilitiesComponent } from '../habilities/habilities.component';
import { TranslocoModule } from '@jsverse/transloco';
import { CardComponent } from '../card/card.component';
import { ProfileInventoryComponent } from '../profile-inventory/profile-inventory.component';
import { trigger, transition, style, animate, query, group } from '@angular/animations';
import { CommonModule } from '@angular/common';

interface Tab {
    id: string;
    label: string;
    icon: string;
}

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MaterialModule,
        ProfileStatsComponent,
        ProfileInventoryComponent,
        HabilitiesComponent,
        TranslocoModule,
        CardComponent
    ],
    animations: [
        trigger('tabAnimation', [
            transition('* <=> *', [
                style({ opacity: 0, transform: 'translateY(10px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ]
})
export class ProfileComponent implements OnInit {

    private _userService: UserService = inject(UserService);
    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _loaderService: LoaderService = inject(LoaderService);
    private _router = inject(Router);

    public profile: Profile | null = null;
    private _user: User | null = null;

    public errorConfirmEmail: boolean = false;
    
    // Sistema de tabs personalizado
    public activeTab: string = 'profile';
    public tabs: Tab[] = [
        { id: 'profile', label: 'profile', icon: '👤' },
        { id: 'stats', label: 'stats', icon: '📊' },
        { id: 'inventory', label: 'inventory', icon: '🎒' },
        { id: 'habilities', label: 'habilities', icon: '✨' }
    ];

    constructor(
        private _snackBar: MatSnackBar
    ) {
        this._user = this._userService.getUser();
    }

    public setActiveTab(tabId: string): void {
        this.activeTab = tabId;
    }

    async ngOnInit(): Promise<void> {
        this._loaderService.setLoading(true);

        try {
            if (this._user) {
                let profile = (await this._supabaseService.getProfileInfo(this._user.id)).data;

                if (profile) {
                    this.profile = profile;
                } else {
                    this._displaySnackbar('No se ha podido cargar el perfil. Por favor, vuelve a iniciar sesión.');
                    this._router.navigate(['']);
                }

                if (this._user.email && !this._user.email_confirmed_at) {
                    this.errorConfirmEmail = true;
                    this._displaySnackbar('Por favor, confirma tu correo electrónico para poder acceder a todas las funcionalidades de la aplicación.');
                }
            } else {
                this._displaySnackbar('No se ha podido cargar el perfil. Por favor, vuelve a iniciar sesión.');
                this._router.navigate(['']);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this._displaySnackbar('Error al cargar el perfil. Por favor, vuelve a iniciar sesión.');
            this._router.navigate(['']);
        } finally {
            this._loaderService.setLoading(false);
        }
    }


    public async signOut() {
        this._loaderService.setLoading(true);
        this._userService.clearUser();
        this._supabaseService.signOut();

        setTimeout(() => {
            this._loaderService.setLoading(false);
            this._router.navigate(['']);
        }, 500);
    }

    private _displaySnackbar(message: string): void {
        this._snackBar.open(message, 'Cerrar', {
            duration: 4000,
        });
    }

    public ngOnDestroy(): void {
        this._loaderService.setLoading(false);
    }

    public goBack(): void {
        this._supabaseService.signOut();
        this._router.navigate(['']);
    }

}