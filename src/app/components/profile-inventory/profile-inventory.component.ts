import { Component, inject, Input, OnInit, signal, computed } from '@angular/core';
import { MaterialModule } from '../../modules/material.module';
import { Item, Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { UserService } from '../../services/user/user.service';
import { LoaderService } from '../../services/loader/loader.service';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoModule } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-profile-inventory',
    templateUrl: './profile-inventory.component.html',
    styleUrls: ['./profile-inventory.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
        TranslocoModule,
        FormsModule,
        CommonModule
    ]
})
export class ProfileInventoryComponent implements OnInit {

    private _userService = inject(UserService);
    private _loaderService = inject(LoaderService);
    private _supabaseService = inject(SupabaseService);
    private _router = inject(Router);
    private _snackBar = inject(MatSnackBar);

    private _user: User | null = null;

    @Input() profile: Profile | null = null;

    public readonly items = signal<Item[]>([]);
    public readonly isLoading = signal<boolean>(false);
    public readonly showForm = signal<boolean>(false);
    public readonly searchTerm = signal<string>('');

    public readonly filteredItems = computed(() => {
        const term = this.searchTerm().toLowerCase();
        if (!term) return this.items();
        return this.items().filter(item => 
            item.name.toLowerCase().includes(term) ||
            item.description?.toLowerCase().includes(term)
        );
    });

    public readonly totalValue = computed(() => 
        this.items().reduce((sum, item) => sum + (item.value || 0), 0)
    );

    public readonly itemCount = computed(() => this.items().length);

    public newItem: Item = this._getEmptyItem();

    async ngOnInit(): Promise<void> {
        this._user = this._userService.getUser();
        
        if (!this._user) {
            this._showSnackbar('Credenciales inválidas. Por favor, inicie sesión nuevamente.', 'error');
            this._router.navigate(['']);
            return;
        }

        await this._loadData();
    }

    private async _loadData(): Promise<void> {
        this.isLoading.set(true);
        
        try {
            if (this._user) {
                const response = await this._supabaseService.getItems(this._user.id);
                this.items.set(response.data || []);
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
            this._showSnackbar('Error al cargar el inventario', 'error');
        } finally {
            this.isLoading.set(false);
        }
    }

    public openForm(): void {
        this.newItem = this._getEmptyItem();
        this.showForm.set(true);
    }

    public closeForm(): void {
        this.showForm.set(false);
        this.newItem = this._getEmptyItem();
    }

    public async saveItem(): Promise<void> {
        if (!this._user) {
            this._showSnackbar('Usuario no autenticado', 'error');
            return;
        }

        if (!this.newItem.name?.trim()) {
            this._showSnackbar('El nombre del objeto es requerido', 'error');
            return;
        }

        this.isLoading.set(true);

        try {
            this.newItem.profile_id = this._user.id;
            this.newItem.quantity = 1;

            await this._supabaseService.saveItemToProfile(this.newItem);
            
            this._showSnackbar('¡Objeto añadido al inventario!', 'success');
            this.closeForm();
            await this._loadData();
        } catch (error) {
            console.error('Error saving item:', error);
            this._showSnackbar('Error al guardar el objeto', 'error');
        } finally {
            this.isLoading.set(false);
        }
    }

    public async deleteItem(item: Item): Promise<void> {
        const snackBarRef = this._snackBar.open(
            `¿Eliminar "${item.name}" del inventario?`,
            'Eliminar',
            {
                duration: 5000,
                verticalPosition: 'bottom',
                panelClass: ['snack-bar-warning']
            }
        );

        snackBarRef.onAction().subscribe(async () => {
            await this._confirmDelete(item);
        });
    }

    private async _confirmDelete(item: Item): Promise<void> {
        if (!this._user) return;

        this.isLoading.set(true);

        try {
            await this._supabaseService.deleteItemFromProfile(item);
            this.items.update(list => list.filter(i => i.id !== item.id));
            this._showSnackbar(`"${item.name}" eliminado`, 'success');
        } catch (error) {
            console.error('Error deleting item:', error);
            this._showSnackbar('Error al eliminar el objeto', 'error');
        } finally {
            this.isLoading.set(false);
        }
    }

    private _getEmptyItem(): Item {
        return {
            id: 0,
            name: '',
            description: '',
            quantity: 1,
            profile_id: '',
            value: 0,
            img_src: ''
        };
    }

    private _showSnackbar(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
        const panelClass = type === 'success' ? 'snack-bar-success' : 
                          type === 'error' ? 'snack-bar-danger' : 'snack-bar-warning';
        
        this._snackBar.open(message, 'Cerrar', {
            duration: 3000,
            verticalPosition: 'bottom',
            panelClass: [panelClass]
        });
    }
}