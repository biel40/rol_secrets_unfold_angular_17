import { Component, inject, OnInit } from '@angular/core';
import { Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { User } from '@supabase/supabase-js';
import { UserService } from '../../services/user/user.service';
import { LoaderService } from '../../services/loader/loader.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

    private _userService: UserService = inject(UserService);
    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _loaderService: LoaderService = inject(LoaderService);
    private _router = inject(Router);

    public profile: Profile | null = null;
    private _user: User | null = null;

    constructor() {
        this._user = this._userService.getUser();
    }

    async ngOnInit(): Promise<void> {
        this._loaderService.setLoading(true);
        
        if (this._user) {
            let profile = (await this._supabaseService.getProfileInfo(this._user.id)).data;

            if (profile) {
                this.profile = profile;
            }
        } else {
            alert('Credenciales inválidas. Por favor, inicie sesión nuevamente.');
            this._router.navigate(['']);
        }

        this._loaderService.setLoading(false);
    }


    public async signOut() {
        this._loaderService.setLoading(true);
        this._userService.clearUser();
        this._supabaseService.signOut();

        setTimeout(() => {
            this._loaderService.setLoading(false);
            this._router.navigate(['']);
        }, 600);
    }

}