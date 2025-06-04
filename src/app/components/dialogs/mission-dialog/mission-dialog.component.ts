import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../modules/material.module';
import { TranslocoModule } from '@jsverse/transloco';
import { Mission, Profile, SupabaseService } from '../../../services/supabase/supabase.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-mission-dialog',
  templateUrl: './mission-dialog.component.html',
  styleUrls: ['./mission-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    TranslocoModule,
    ReactiveFormsModule,
    MatDialogContent,
    MatDialogActions
  ]
})
export class MissionDialogComponent implements OnInit {
  
  public missionForm: FormGroup;
  public isEditMode: boolean = false;
  public isSubmitting: boolean = false;
  public profilesList: Profile[] = [];

  // Mission difficulty options
  public difficultyOptions = [
    { value: 'easy', label: 'easy' },
    { value: 'medium', label: 'medium' },
    { value: 'hard', label: 'hard' },
    { value: 'legendary', label: 'legendary' }
  ];

  // Mission status options
  public statusOptions = [
    { value: 'pending', label: 'pending' },
    { value: 'in_progress', label: 'in-progress' },
    { value: 'completed', label: 'completed' },
    { value: 'failed', label: 'failed' }
  ];

  constructor(
    private _dialogRef: MatDialogRef<MissionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mission?: Mission, profiles: Profile[] },
    private _formBuilder: FormBuilder,
    private _supabaseService: SupabaseService,
    private _snackBar: MatSnackBar
  ) {
    this.profilesList = this.data.profiles || [];
    this.isEditMode = !!this.data.mission;
    
    this.missionForm = this._formBuilder.group({
      title: [this.data.mission?.title || '', [Validators.required]],
      description: [this.data.mission?.description || '', [Validators.required]],
      status: [this.data.mission?.status || 'pending', [Validators.required]],
      difficulty: [this.data.mission?.difficulty || 'easy', [Validators.required]],
      assigned_to: [this.data.mission?.assigned_to || ''],
      reward_xp: [this.data.mission?.reward_xp || 0],
      reward_gold: [this.data.mission?.reward_gold || 0]
    });
  }

  public ngOnInit(): void {
    // Component initialization if needed
  }

  public async saveMission(): Promise<void> {
    if (this.missionForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      try {
        const formValue = this.missionForm.value;
        const missionData: Mission = {
          title: formValue.title,
          description: formValue.description,
          status: formValue.status,
          difficulty: formValue.difficulty,
          assigned_to: formValue.assigned_to || undefined,
          reward_xp: formValue.reward_xp,
          reward_gold: formValue.reward_gold
        };

        let result;
        if (this.isEditMode && this.data.mission) {
          // Update existing mission
          missionData.id = this.data.mission.id;
          result = await this._supabaseService.updateMission(missionData);
          this._displaySnackbar('mission-updated');
        } else {
          // Create new mission
          result = await this._supabaseService.createMission(missionData);
          this._displaySnackbar('mission-created');
        }

        if (result.data) {
          this._dialogRef.close(result.data);
        }
      } catch (error) {
        console.error('Error saving mission:', error);
        this._displaySnackbar(this.isEditMode ? 'error-updating-mission' : 'error-creating-mission');
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  public closeDialog(): void {
    this._dialogRef.close();
  }

  public getAssignedProfileName(profileId: string): string {
    const profile = this.profilesList.find(p => p.id === profileId);
    return profile?.username || 'Usuario desconocido';
  }

  private _displaySnackbar(messageKey: string): void {
    // For now, we'll use a simple message. In a real app, you'd use TranslocoService
    this._snackBar.open(messageKey, 'Cerrar', {
      duration: 3000,
      verticalPosition: 'bottom'
    });
  }
}
