import { Component, inject, OnInit, signal, computed, HostListener } from '@angular/core';
import { MaterialModule } from '../../modules/material.module';
import { Item } from '../../services/supabase/supabase.service';
import { ProfileStateService } from '../../services/profile/profile-state.service';
import { UserService } from '../../services/user/user.service';
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
    private _profileState = inject(ProfileStateService);
    private _router = inject(Router);
    private _snackBar = inject(MatSnackBar);

    private _user: User | null = null;

    /** Delegated to service signal — pre-loaded before tab activates. */
    public get items() { return this._profileState.items; }
    public get isLoading() { return this._profileState.itemsLoading; }

    public readonly showForm = signal<boolean>(false);
    public readonly editingItem = signal<Item | null>(null);
    public readonly searchTerm = signal<string>('');

    public readonly lastUpdatedLabel = computed(() => {
        const profile = this._profileState.profile();
        if (!profile?.updated_at) return '---';
        const date = new Date(profile.updated_at);
        if (Number.isNaN(date.getTime())) return '---';
        return date.toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    });

    public get isEditing(): boolean {
        return this.editingItem() !== null;
    }

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

    ngOnInit(): void {
        this._user = this._userService.getUser();

        if (!this._user) {
            this._showSnackbar('Credenciales inválidas. Por favor, inicie sesión nuevamente.', 'error');
            this._router.navigate(['']);
        }
    }



    public openForm(): void {
        this.newItem = this._getEmptyItem();
        this.editingItem.set(null);
        this.showForm.set(true);
    }

    public openEditForm(item: Item): void {
        this.newItem = { ...item };
        this.editingItem.set(item);
        this.showForm.set(true);
    }

    public closeForm(): void {
        this.showForm.set(false);
        this.editingItem.set(null);
        this.newItem = this._getEmptyItem();
    }

    @HostListener('window:keydown', ['$event'])
    public handleShortcut(event: KeyboardEvent): void {
        if (!(event.metaKey || event.ctrlKey)) {
            return;
        }

        if (event.key.toLowerCase() !== 's') {
            return;
        }

        if (!this.showForm()) {
            return;
        }

        event.preventDefault();
        this.saveItem();
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

        let ok: boolean;

        if (this.isEditing) {
            ok = await this._profileState.updateItem({ ...this.newItem });
            if (ok) {
                this._showSnackbar('¡Objeto actualizado!', 'success');
            }
        } else {
            ok = await this._profileState.addItem({ ...this.newItem }, this._user.id);
            if (ok) {
                this._showSnackbar('¡Objeto añadido al inventario!', 'success');
            }
        }

        if (ok) {
            this.closeForm();
        } else {
            this._showSnackbar('Error al guardar el objeto', 'error');
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
        const ok = await this._profileState.removeItem(item);
        if (ok) {
            this._showSnackbar(`"${item.name}" eliminado`, 'success');
        } else {
            this._showSnackbar('Error al eliminar el objeto', 'error');
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

