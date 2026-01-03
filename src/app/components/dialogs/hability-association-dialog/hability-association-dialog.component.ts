import { Component, Inject, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../modules/material.module';
import { TranslocoModule } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Hability, ProfileSummary, SupabaseService } from '../../../services/supabase/supabase.service';

export interface HabilityAssociationDialogData {
    hability: Hability;
    profiles: ProfileSummary[];
    currentAssociations: string[];
}

export interface HabilityAssociationDialogResult {
    selectedProfiles: string[];
    habilityId: string;
}

interface SelectableProfile extends ProfileSummary {
    selected: boolean;
    matchesSearch: boolean;
}

@Component({
    selector: 'app-hability-association-dialog',
    templateUrl: './hability-association-dialog.component.html',
    styleUrls: ['./hability-association-dialog.component.scss'],
    standalone: true,
    imports: [
        MaterialModule,
        TranslocoModule,
        CommonModule,
        FormsModule
    ]
})
export class HabilityAssociationDialogComponent implements OnInit {
    private _supabaseService = inject(SupabaseService);

    public hability: Hability;
    public selectableProfiles: SelectableProfile[] = [];
    public searchTerm: string = '';
    public isLoading: boolean = false;
    public isSaving: boolean = false;

    // Power themes for visual styling
    private _powerThemes: { [key: string]: { icon: string, color: string, gradient: string } } = {
        'pyro': { icon: '🔥', color: '#e74c3c', gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)' },
        'hydro': { icon: '💧', color: '#3498db', gradient: 'linear-gradient(135deg, #3498db, #2980b9)' },
        'geo': { icon: '🪨', color: '#8b4513', gradient: 'linear-gradient(135deg, #8b4513, #654321)' },
        'electro': { icon: '⚡', color: '#9b59b6', gradient: 'linear-gradient(135deg, #9b59b6, #8e44ad)' },
        'cryo': { icon: '❄️', color: '#74b9ff', gradient: 'linear-gradient(135deg, #74b9ff, #0984e3)' },
        'natura': { icon: '🌿', color: '#27ae60', gradient: 'linear-gradient(135deg, #27ae60, #1e8449)' },
        'aero': { icon: '🌪️', color: '#00cec9', gradient: 'linear-gradient(135deg, #00cec9, #00b894)' },
        'light': { icon: '✨', color: '#f39c12', gradient: 'linear-gradient(135deg, #f39c12, #d68910)' },
        'dark': { icon: '🌑', color: '#2c3e50', gradient: 'linear-gradient(135deg, #2c3e50, #1a252f)' },
        'universal': { icon: '🌌', color: '#8e44ad', gradient: 'linear-gradient(135deg, #8e44ad, #6c3483)' }
    };

    constructor(
        public dialogRef: MatDialogRef<HabilityAssociationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: HabilityAssociationDialogData
    ) {
        this.hability = data.hability;
    }

    public ngOnInit(): void {
        this._initializeProfiles();
    }

    private _initializeProfiles(): void {
        this.selectableProfiles = this.data.profiles.map(profile => ({
            ...profile,
            selected: this.data.currentAssociations.includes(profile.id!),
            matchesSearch: true
        }));
    }

    public get powerTheme(): { icon: string, color: string, gradient: string } {
        const normalizedPower = this.hability.power?.trim().toLowerCase();
        return this._powerThemes[normalizedPower] || { icon: '⭐', color: '#95a5a6', gradient: 'linear-gradient(135deg, #95a5a6, #7f8c8d)' };
    }

    public get selectedCount(): number {
        return this.selectableProfiles.filter(p => p.selected).length;
    }

    public get visibleProfiles(): SelectableProfile[] {
        return this.selectableProfiles.filter(p => p.matchesSearch);
    }

    public get hasChanges(): boolean {
        const currentSelected = this.selectableProfiles.filter(p => p.selected).map(p => p.id);
        const originalSelected = this.data.currentAssociations;

        if (currentSelected.length !== originalSelected.length) return true;
        return !currentSelected.every(id => originalSelected.includes(id!));
    }

    public onSearchChange(): void {
        const term = this.searchTerm.toLowerCase().trim();
        this.selectableProfiles.forEach(profile => {
            profile.matchesSearch = !term || (profile.username?.toLowerCase().includes(term) ?? false);
        });
    }

    public clearSearch(): void {
        this.searchTerm = '';
        this.onSearchChange();
    }

    public toggleProfile(profile: SelectableProfile): void {
        profile.selected = !profile.selected;
    }

    public selectAll(): void {
        this.visibleProfiles.forEach(p => p.selected = true);
    }

    public deselectAll(): void {
        this.visibleProfiles.forEach(p => p.selected = false);
    }

    public onCancel(): void {
        this.dialogRef.close();
    }

    public async onSave(): Promise<void> {
        if (!this.hability.id) {
            console.error('No hability ID found');
            return;
        }

        this.isSaving = true;

        try {
            const selectedProfileIds = this.selectableProfiles
                .filter(p => p.selected)
                .map(p => p.id!);

            const result = await this._supabaseService.associateHabilityWithProfiles(
                this.hability.id,
                selectedProfileIds
            );

            if (result.error) {
                console.error('Error saving associations:', result.error);
                return;
            }

            const dialogResult: HabilityAssociationDialogResult = {
                selectedProfiles: selectedProfileIds,
                habilityId: this.hability.id
            };

            this.dialogRef.close(dialogResult);
        } catch (error) {
            console.error('Error saving associations:', error);
        } finally {
            this.isSaving = false;
        }
    }

    public getProfileInitials(username: string | undefined): string {
        if (!username) return '??';
        return username.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }
}
