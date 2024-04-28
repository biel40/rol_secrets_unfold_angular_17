import { Component, inject, Input, OnInit } from '@angular/core';
import { MaterialModule } from '../../modules/material.module';
import { UserService } from '../../services/user/user.service';
import { LoaderService } from '../../services/loader/loader.service';
import { Hability, Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';

@Component({
    selector: 'app-habilities',
    templateUrl: './habilities.component.html',
    styleUrls: ['./habilities.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
    ]
})
export class HabilitiesComponent implements OnInit {

    private _userService: UserService = inject(UserService);
    private _loaderService: LoaderService = inject(LoaderService);
    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _router = inject(Router);

    public user: User | null = null;
    @Input() public profile: Profile | null = null;

    public userHabilities: Hability[] = [];

    constructor() { }

    async ngOnInit(): Promise<void> {
        this._loaderService.setLoading(true);

        this.user = await this._userService.getUser();

        if (!this.user) {
            alert('Credenciales inválidas. Por favor, inicie sesión nuevamente.');
            this._router.navigate(['']);
        }
    }

    async ngOnChanges() {
        if (this.profile) {
            this.userHabilities = (await this._supabaseService.getHabilitiesFromUser(this.profile));
        }

        this._loaderService.setLoading(false);
    }

    public addUses(hability: Hability) {
        
    }

    public removeUses(hability: Hability) {
        
    }

    public calculateDamage(hability: Hability) {
        
    }

}