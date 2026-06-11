import { Component, inject, OnInit, HostListener } from '@angular/core';
import { Profile } from '../../services/supabase/supabase.service';
import { User } from '@supabase/supabase-js';
import { UserService } from '../../services/user/user.service';
import { LoaderService } from '../../services/loader/loader.service';
import { ProfileStateService } from '../../services/profile/profile-state.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../modules/material.module';
import { ProfileStatsComponent } from '../profile-stats/profile-stats.component';
import { PlayerHabilitiesComponent } from '../player-habilities/player-habilities.component';
import { TranslocoModule } from '@jsverse/transloco';
import { CardComponent } from '../card/card.component';
import { ProfileInventoryComponent } from '../profile-inventory/profile-inventory.component';
import { trigger, transition, style, animate, query, group } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
        PlayerHabilitiesComponent,
        TranslocoModule,
        CardComponent,
        MatProgressSpinnerModule
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
    private _profileState = inject(ProfileStateService);
    private _loaderService: LoaderService = inject(LoaderService);
    private _router = inject(Router);

    private _user: User | null = null;

    /** Backed by the service signal — no local copy, no change detection needed. */
    public get profile(): Profile | null {
        return this._profileState.profile();
    }

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

    @HostListener('window:keydown', ['$event'])
    public handleShortcut(event: KeyboardEvent): void {
        if (!(event.metaKey || event.ctrlKey)) {
            return;
        }

        if (!['1', '2', '3', '4'].includes(event.key)) {
            return;
        }

        const tabIndex = Number(event.key) - 1;
        const tab = this.tabs[tabIndex];

        if (!tab) {
            return;
        }

        event.preventDefault();
        this.setActiveTab(tab.id);
    }

    async ngOnInit(): Promise<void> {
        // Defer loading state to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => this._loaderService.setLoading(true));

        try {
            if (this._user) {
                const profile = await this._profileState.loadProfileWithHabilities(this._user.id);

                if (!profile) {
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
            setTimeout(() => this._loaderService.setLoading(false));
        }
    }


    public async signOut(): Promise<void> {
        this._loaderService.setLoading(true);
        
        try {
            await this._userService.signOut();
            this._router.navigate(['']);
        } finally {
            this._loaderService.setLoading(false);
        }
    }

    private _displaySnackbar(message: string): void {
        this._snackBar.open(message, 'Cerrar', {
            duration: 4000,
        });
    }

    public ngOnDestroy(): void {
        this._loaderService.setLoading(false);
        this._profileState.clear();
    }

    public async goBack(): Promise<void> {
        await this._userService.signOut();
        this._router.navigate(['']);
    }

}