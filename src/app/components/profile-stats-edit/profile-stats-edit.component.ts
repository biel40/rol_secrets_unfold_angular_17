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
        current_hp: 0,
        total_hp: 0,
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
            const { current_hp, total_hp, attack, special_attack, defense, special_defense, speed } = this.profile;

            this.updateProfileStatsForm.patchValue({
                current_hp,
                total_hp,
                attack,
                defense,
                special_attack,
                special_defense,
                speed
            });
        }
    }

    public async updateProfileStats(): Promise<void> {
        try {
            if (!this.user) {
                alert('Credenciales inválidas. Por favor, inicie sesión nuevamente.');
                this._router.navigate(['']);
            }

            if (this.profile) {
                let id: string = this.profile?.id ? this.profile.id : '';

                let attack: number = this.updateProfileStatsForm.get('attack')?.getRawValue();
                let defense: number = this.updateProfileStatsForm.get('defense')?.getRawValue();
                let special_attack: number = this.updateProfileStatsForm.get('special_attack')?.getRawValue();
                let special_defense: number = this.updateProfileStatsForm.get('special_defense')?.getRawValue();
                let speed: number = this.updateProfileStatsForm.get('speed')?.getRawValue();

                let profile: Profile = {
                    id,
                    clase: this.profile.clase,
                    level: this.profile.level,
                    power: this.profile.power,
                    weapon: this.profile.weapon,
                    attack,
                    defense,
                    special_attack,
                    special_defense,
                    speed
                };

                await this._supabaseService.updateProfileStats(profile);
                
                alert('Estadísticas del perfil actualizadas correctamente!');

                this._router.navigate(['profile']);
            }
        } catch (error) {
            console.error('Error updating profile stats:', error);
        }
    }

    public goBack() : void {
        this._router.navigate(['profile']);
    }

}