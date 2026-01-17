import { Component, inject, Input, OnInit, HostListener } from '@angular/core';
import { MaterialModule } from '../../modules/material.module';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { User } from '@supabase/supabase-js';
import { LoaderService } from '../../services/loader/loader.service';
import { UserService } from '../../services/user/user.service';
import { TranslocoModule } from '@jsverse/transloco';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-profile-edit',
    templateUrl: './profile-edit.component.html',
    styleUrls: ['./profile-edit.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
        ReactiveFormsModule,
        TranslocoModule
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

    public classList: string[] = ['Guerrero', 'Mago', 'Explorador', 'Asesino', 'Paladín', 'Arquero', 'Bárbaro', 'Clérigo', 'Hechicero', 'Monje', 'Bardo', 'Druida', 'Brujo', 'Soldado Arcano', 'Oficinista', 'Capitán Kendo']
    public powerList: string[] = ['Pyro', 'Hydro', 'Geo', 'Aero', 'Combat', 'Electro'];
    public weaponList: string[] = ['Espada', 'Mandoble', 'Arco', 'Daga', 'Libro de hechizos', 'Puños', 'Bastón'];
    public levels: number[] = [0, 1, 2, 3, 4];

    public updateProfileForm = this._formBuilder.group({
        username: '',
        clase: '',
        power: '',
        level: 0,
        weapon: '',
        image_url: ''
    });

    public profile: Profile | null = null;
    public avatarPreview: string = '';
    private readonly _maxAvatarSize = 2 * 1024 * 1024;

    constructor(
        private _snackBar: MatSnackBar
    ) { }

    async ngOnInit(): Promise<void> {

        this._loaderService.setLoading(true);

        this.user = this._userService.getUser();

        if (!this.user) {
            this._displaySnackbar('Credenciales inválidas. Por favor, inicie sesión nuevamente.', true);
            this._router.navigate(['']);
            return;
        } else {
            this.profile = (await this._supabaseService.getProfileInfo(this.user.id)).data;

            if (this.profile) {
                const { username, clase, power, level, weapon, image_url } = this.profile;

                this.updateProfileForm.patchValue({
                    username,
                    clase,
                    power,
                    level,
                    weapon,
                    image_url
                });
                this.avatarPreview = image_url || '';
            }
        }

        this._loaderService.setLoading(false);
    }

    @HostListener('window:keydown', ['$event'])
    public handleShortcut(event: KeyboardEvent): void {
        if (!(event.metaKey || event.ctrlKey)) {
            return;
        }

        if (event.key.toLowerCase() !== 's') {
            return;
        }

        event.preventDefault();
        this.updateProfile();
    }

    public async updateProfile(): Promise<void> {
        this._loaderService.setLoading(true);

        const username = this.updateProfileForm.value.username as string;
        const clase = this.updateProfileForm.value.clase as string;
        const power = this.updateProfileForm.value.power as string;
        const level = this.updateProfileForm.value.level as number;
        const weapon = this.updateProfileForm.value.weapon as string;
        const image_url = this.updateProfileForm.value.image_url as string;

        if (this.user) {
            await this._supabaseService.updateProfile({
                id: this.user?.id,
                username,
                clase,
                power,
                level,
                weapon,
                image_url
            });


            this._loaderService.setLoading(false);

            this._router.navigate(['profile']);
        }
    }

    public handleAvatarUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            this._displaySnackbar('Selecciona una imagen valida.', true);
            input.value = '';
            return;
        }

        if (file.size > this._maxAvatarSize) {
            this._displaySnackbar('La imagen supera el limite de 2MB.', true);
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            this.avatarPreview = result;
            this.updateProfileForm.patchValue({ image_url: result });
        };
        reader.onerror = () => {
            this._displaySnackbar('No se pudo cargar la imagen.', true);
        };
        reader.readAsDataURL(file);
    }

    public removeAvatar(): void {
        this.avatarPreview = '';
        this.updateProfileForm.patchValue({ image_url: '' });
    }

    private _displaySnackbar(message: string, isError: boolean = false): void {
        this._snackBar.open(message, 'Cerrar', {
            duration: 4000,
            panelClass: isError ? ['custom-snackbar', 'error-snackbar'] : ['custom-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
        });
    }

    public goBack(): void {
        this._router.navigate(['profile']);
    }

    ngOnChanges(): void {
        if (this.profile) {
            const { username, clase, power, level, weapon, image_url } = this.profile;

            this.updateProfileForm.patchValue({
                username,
                clase,
                power,
                level,
                weapon,
                image_url
            });
            this.avatarPreview = image_url || '';
        }

        this._loaderService.setLoading(false);
    }

}
