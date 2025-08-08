import { Component, Inject, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../modules/material.module';
import { TranslocoModule } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Hability, ProfileSummary, SupabaseService } from '../../../services/supabase/supabase.service';

@Component({
  selector: 'app-hability-dialog',
  templateUrl: './hability-dialog.component.html',
  styleUrls: ['./hability-dialog.component.scss'],
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    TranslocoModule,
    CommonModule
  ]
})
export class HabilityDialogComponent implements OnInit {
  private _formBuilder = inject(FormBuilder);
  private _supabaseService = inject(SupabaseService);

  public habilityForm: FormGroup;
  public isEditing: boolean = false;
  public availableProfiles: ProfileSummary[] = [];
  public isLoadingProfiles: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<HabilityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { hability?: Hability, associatedProfiles?: string[] }
  ) {
    this.isEditing = !!this.data?.hability;
    
    this.habilityForm = this._formBuilder.group({
      name: [this.data?.hability?.name || '', [Validators.required, Validators.minLength(2)]],
      description: [this.data?.hability?.description || '', [Validators.required, Validators.minLength(10)]],
      clase: [this.data?.hability?.clase || '', [Validators.required]],
      power: [this.data?.hability?.power || '', [Validators.required]],
      level: [this.data?.hability?.level || 1, [Validators.required, Validators.min(1), Validators.max(20)]],
      total_uses: [this.data?.hability?.total_uses || 1, [Validators.required, Validators.min(1)]],
      current_uses: [this.data?.hability?.current_uses || 1, [Validators.required, Validators.min(0)]],
      dice: [this.data?.hability?.dice || '', [Validators.required]],
      scales_with: [this.data?.hability?.scales_with || '', [Validators.required]],
      associatedProfiles: [this.data?.associatedProfiles || [], []]
    });
  }

  public async ngOnInit(): Promise<void> {
    await this.loadProfiles();
  }

  private async loadProfiles(): Promise<void> {
    this.isLoadingProfiles = true;
    try {
      const { data: profiles, error } = await this._supabaseService.getAllProfiles();
      if (error) {
        console.error('Error loading profiles:', error);
      } else {
        this.availableProfiles = profiles || [];
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      this.isLoadingProfiles = false;
    }
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public onSave(): void {
    if (this.habilityForm.valid) {
      const formValue = this.habilityForm.value;
      const habilityData: Hability = {
        name: formValue.name,
        description: formValue.description,
        clase: formValue.clase,
        power: formValue.power,
        level: formValue.level,
        total_uses: formValue.total_uses,
        current_uses: formValue.current_uses,
        dice: formValue.dice,
        scales_with: formValue.scales_with
      };

      if (this.isEditing && this.data.hability?.id) {
        habilityData.id = this.data.hability.id;
      }

      // Return both hability data and associated profiles
      this.dialogRef.close({
        hability: habilityData,
        associatedProfiles: formValue.associatedProfiles
      });
    }
  }

  // Helper method to get error messages
  public getErrorMessage(fieldName: string): string {
    const field = this.habilityForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return `${fieldName} es obligatorio`;
    }
    if (field?.hasError('minlength')) {
      return `${fieldName} debe tener al menos ${field.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (field?.hasError('min')) {
      return `${fieldName} debe ser mayor a ${field.errors?.['min'].min - 1}`;
    }
    if (field?.hasError('max')) {
      return `${fieldName} debe ser menor o igual a ${field.errors?.['max'].max}`;
    }
    
    return '';
  }

  // Predefined options for dropdowns
  public claseOptions = [
    'Guerrero',
    'Mago',
    'Ladron',
    'Clerigo',
    'Ranger',
    'Bardo',
    'Paladin',
    'Brujo'
  ];

  public powerOptions = [
    'pyro',
    'hydro',
    'aero',
    'geo',
    'electro',
    'cryo',
    'dendro',
    'anemo',
    'light',
    'dark',
    'void',
    'arcane'
  ];

  public scalesWithOptions = [
    'Fuerza',
    'Destreza',
    'Constitución',
    'Inteligencia',
    'Sabiduría',
    'Carisma',
    'Nivel'
  ];
}
