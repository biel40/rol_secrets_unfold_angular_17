import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../modules/material.module';
import { TranslocoModule } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Enemy } from '../../../services/supabase/supabase.service';

@Component({
  selector: 'app-enemy-dialog',
  templateUrl: './enemy-dialog.component.html',
  styleUrls: ['./enemy-dialog.component.scss'],
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    TranslocoModule,
    CommonModule
  ]
})
export class EnemyDialogComponent {
  private _formBuilder = inject(FormBuilder);

  public enemyForm: FormGroup;
  public isEditing: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<EnemyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { enemy?: Enemy }
  ) {
    this.isEditing = !!this.data?.enemy;
    
    this.enemyForm = this._formBuilder.group({
      name: [this.data?.enemy?.name || '', [Validators.required, Validators.minLength(2)]],
      description: [this.data?.enemy?.description || '', [Validators.required, Validators.minLength(10)]],
      level: [this.data?.enemy?.level || 1, [Validators.required, Validators.min(1), Validators.max(100)]],
      total_hp: [this.data?.enemy?.total_hp || 100, [Validators.required, Validators.min(1)]],
      current_hp: [this.data?.enemy?.current_hp || this.data?.enemy?.total_hp || 100, [Validators.required, Validators.min(0)]],
      is_boss: [this.data?.enemy?.is_boss || false],
      image_url: [this.data?.enemy?.image_url || '', [Validators.required]]
    });

    // Auto-update current_hp when total_hp changes (only if creating new enemy)
    if (!this.isEditing) {
      this.enemyForm.get('total_hp')?.valueChanges.subscribe(value => {
        if (value && value > 0) {
          this.enemyForm.get('current_hp')?.setValue(value);
        }
      });
    }
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public onSave(): void {
    if (this.enemyForm.valid) {
      const enemyData: Enemy = {
        ...this.enemyForm.value
      };

      if (this.isEditing && this.data.enemy?.id) {
        enemyData.id = this.data.enemy.id;
      }

      this.dialogRef.close(enemyData);
    }
  }

  // Helper method to get error messages
  public getErrorMessage(fieldName: string): string {
    const field = this.enemyForm.get(fieldName);
    
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

  // Handle image load error
  public onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  // Handle image load success
  public onImageLoad(event: any): void {
    event.target.style.display = 'block';
  }
}
