import { Component, inject, Input, OnInit } from '@angular/core';
import { MaterialModule } from '../../modules/material.module';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { User } from '@supabase/supabase-js';
import { LoaderService } from '../../services/loader/loader.service';
import { UserService } from '../../services/user/user.service';

@Component({
    selector: 'app-profile-edit',
    templateUrl: './profile-edit.component.html',
    styleUrls: ['./profile-edit.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
        RouterLink,
        ReactiveFormsModule
    ]
})
export class ProfileEditComponent implements OnInit {

    private _formBuilder: FormBuilder = inject(FormBuilder);
    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _userService = inject(UserService);
    private _loaderService = inject(LoaderService);
    public _router = inject(Router);

    public user: User | null = null;
    public emailFormControl = new FormControl('', [Validators.required, Validators.email]);

    public classList: string[] = ['Guerrero', 'Arquero', 'Mago', 'Sacerdote', 'Bárbaro', 'Pícaro', 'Monje']
    public powerList: string[] = ['Pyro', 'Electro', 'Hydro', 'Aero', 'Geo', 'Natura'];
    public weaponList: string[] = ['Espada', 'Mandoble', 'Arco', 'Daga', 'Libro de hechizos', 'Puños', 'Bastón'];
    public levels: number[] = [0, 1, 2, 3, 4];

    public updateProfileForm = this._formBuilder.group({
        username: '',
        clase: '',
        power: '',
        level: 0,
        weapon: ''
    });

    public profile: Profile | null = null;

    constructor() { }

    async ngOnInit(): Promise<void> {

        this._loaderService.setLoading(true);

        this.user = this._userService.getUser();

        if (!this.user) {
            alert('Credenciales inválidas. Por favor, inicie sesión nuevamente.');
            this._router.navigate(['']);
        } else {
            this.profile = (await this._supabaseService.getProfileInfo(this.user.id)).data;
        }

        this._loaderService.setLoading(false);
    }

    public updateProfile() : void {
        const { username, clase, power, level, weapon } = this.updateProfileForm.value;

        if (this.profile) {
            
        }
    }

    ngOnChanges() : void {
        if (this.profile) {
            const { username, clase, power, level, weapon } = this.profile;
      
            this.updateProfileForm.patchValue({
              username,
              clase,
              power,
              level,
              weapon
            });
        }

        this._loaderService.setLoading(false);
    }

}