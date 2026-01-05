import { Component, inject, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { MaterialModule } from '../../modules/material.module';
import { Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { UserService } from '../../services/user/user.service';
import { LoaderService } from '../../services/loader/loader.service';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoModule } from '@jsverse/transloco';
import { VanillaTiltDirective } from '../../directives/vanilla-tilt.directive';

@Component({
    selector: 'app-profile-info',
    templateUrl: './profile-info.component.html',
    styleUrls: ['./profile-info.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
        TranslocoModule,
        VanillaTiltDirective
    ]
})
export class ProfileInfoComponent implements OnInit {

    private _userService: UserService = inject(UserService);
    private _loaderService: LoaderService = inject(LoaderService);
    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _router = inject(Router);
    private _cdr = inject(ChangeDetectorRef);

    private _user: User | null = null;

    public imageSrc: string = "";
    public classEmoji = '👋';
    public elementEmoji = '🔥';
    public weaponEmoji = '🗡️';

    @Input() profile: Profile | null = null;

    constructor(
        private _snackBar: MatSnackBar
    ) {
        this._user = this._userService.getUser();
    }

    async ngOnInit(): Promise<void> {
        if (!this._user) {
            alert('Credenciales inválidas. Por favor, inicie sesión nuevamente.');
            this._router.navigate(['']);
        } else if (!this.profile) {
            const profileData = (await this._supabaseService.getProfileInfo(this._user.id)).data;
            
            this.profile = profileData;
            // Default profile image
            if (this.profile && (this.profile.image_url == '' || this.profile.image_url == null)) {
                this.profile.image_url = 'https://iili.io/Ji7Prrl.jpg';
            }
            this.setElementEmojis();
            this._cdr.detectChanges();
        }
        this.setElementEmojis();
    }

    public ngOnChanges() : void {
        this.setElementEmojis();
    }

    public setElementEmojis() : void {
        if (this.profile?.power.toUpperCase() == 'PYRO') {
            this.elementEmoji = '🔥';
        } else if (this.profile?.power.toUpperCase() == 'HYDRO') {
            this.elementEmoji = '💧';
        } else if (this.profile?.power.toUpperCase() == 'ELECTRO') {
            this.elementEmoji = '⚡';
        } else if (this.profile?.power.toUpperCase() == 'CRYO') {
            this.elementEmoji = '❄️';
        } else if (this.profile?.power.toUpperCase() == 'GEO') {
            this.elementEmoji = '🌍';
        } else if (this.profile?.power.toUpperCase() == 'NATURA') {
            this.elementEmoji = '🌿';
        } else if (this.profile?.power.toUpperCase() == 'AERO') {
            this.elementEmoji = '🌪️';
        }

        if (this.profile?.clase.toUpperCase() == 'RANGER') {
            this.classEmoji = '🏹';
        } else if (this.profile?.clase.toUpperCase() == 'WARRIOR' || this.profile?.clase.toUpperCase() == 'GUERRERO') {
            this.classEmoji = '⚔️';
        } else if (this.profile?.clase.toUpperCase() == 'MAGE' || this.profile?.clase.toUpperCase() == 'MAGO') {
            this.classEmoji = '🧙';
        } else if (this.profile?.clase.toUpperCase() == 'HEALER' || this.profile?.clase.toUpperCase() == 'SACERDOTE') {
            this.classEmoji = '🩺';
        } else if (this.profile?.clase.toUpperCase() == 'BÁRBARO') {
            this.classEmoji = '🪓';
        } else if (this.profile?.clase.toUpperCase() == 'ROGUE' || this.profile?.clase.toUpperCase() == 'LADRÓN' || this.profile?.clase.toUpperCase() == 'PÍCARO') {
            this.classEmoji = '🗡️';
        }

        if (this.profile?.weapon.toUpperCase() == 'SWORD' || this.profile?.weapon.toUpperCase() == 'ESPADA') {
            this.weaponEmoji = '⚔️';
        } else if (this.profile?.weapon.toUpperCase() == 'BOW' || this.profile?.weapon.toUpperCase() == 'ARCO') {
            this.weaponEmoji = '🏹';
        } else if (this.profile?.weapon.toUpperCase() == 'STAFF' || this.profile?.weapon.toUpperCase() == 'BASTÓN') {
            this.weaponEmoji = '🧙';
        }
        
    }
}