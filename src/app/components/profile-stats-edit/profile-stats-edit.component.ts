import { Component, inject, OnInit } from '@angular/core';
import { Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { User } from '@supabase/supabase-js';
import { MaterialModule } from '../../modules/material.module';
import { TranslocoModule } from '@jsverse/transloco';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user/user.service';

@Component({
    selector: 'app-profile-stats-edit',
    templateUrl: './profile-stats-edit.component.html',
    styleUrls: ['./profile-stats-edit.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
        TranslocoModule,
        ReactiveFormsModule
    ]
})
export class ProfileStatsEditComponent implements OnInit {

    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _userService = inject(UserService);
    private _formBuilder = inject(FormBuilder);
    private _router = inject(Router);

    public user: User | null = null;
    public profile: Profile | null = null;

    public updateProfileStatsForm = this._formBuilder.group({
        attack: 0,
        defense: 0,
        special_attack: 0,
        special_defense: 0,
        speed: 0
    });

    constructor() {
        this.user = this._userService.getUser();
    }

    public async ngOnInit(): Promise<void> {

        if (!this.user) {
            alert('Credenciales inválidas. Por favor, inicie sesión nuevamente.');
            this._router.navigate(['']);
        }

        if (this.user) {
            this.profile = (await this._supabaseService.getProfileInfo(this.user.id)).data;
        }

        if (this.profile) {
            const { attack, special_attack, defense, special_defense, speed } = this.profile;

            console.log(this.profile)
            console.log(this.profile.power)

            this.updateProfileStatsForm.patchValue({
                attack,
                defense,
                special_attack,
                special_defense,
                speed
            });
        }
    }

    public async updateProfileStats(): Promise<void> {

    }

    public goBack() : void {
        this._router.navigate(['profile']);
    }

}