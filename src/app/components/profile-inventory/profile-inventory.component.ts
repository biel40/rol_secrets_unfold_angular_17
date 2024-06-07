import { Component, inject, Input, OnInit } from '@angular/core';
import { MaterialModule } from '../../modules/material.module';
import { Item, Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { UserService } from '../../services/user/user.service';
import { LoaderService } from '../../services/loader/loader.service';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-profile-inventory',
    templateUrl: './profile-inventory.component.html',
    styleUrls: ['./profile-inventory.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
        TranslocoModule
    ]
})
export class ProfileInventoryComponent implements OnInit {

    private _userService: UserService = inject(UserService);
    private _loaderService: LoaderService = inject(LoaderService);
    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _router = inject(Router);
    private _user: User | null = null;

    @Input() profile: Profile | null = null;


    public items: any[] | null = null;
        
    constructor(
        private _snackBar: MatSnackBar
    ) {
        this._user = this._userService.getUser();
    }

    async ngOnInit(): Promise<void> {
        this._loaderService.setLoading(true);
        
        if (!this._user) {
            alert('Credenciales inválidas. Por favor, inicie sesión nuevamente.');
            this._router.navigate(['']);
        } 

        this._loadData();
    }

    private async _loadData(): Promise<void> {
        this._loaderService.setLoading(true);

        if (this._user) {
            let response = await this._supabaseService.getItems(this._user.id);

            this.items = response.data;

            console.log('Items fetched:', this.items);
        }

        this._loaderService.setLoading(false);
    }

    ngOnChanges() : void {

    }

    public goToEditStats(): void {
        this._router.navigate(['profile-stats-edit']);
    }

    private _displaySnackbar(message: string) {
        this._snackBar.open(message, 'Cerrar', {
            duration: 5000,
            verticalPosition: 'bottom'
        });
    }
}