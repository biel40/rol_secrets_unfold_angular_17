import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../modules/material.module';
import { TranslocoModule } from '@jsverse/transloco';
import { Profile, SupabaseService } from '../../../services/supabase/supabase.service';

export interface ProfileEditDialogData {
  profile: Profile;
}

@Component({
  selector: 'app-profile-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    TranslocoModule,
    ReactiveFormsModule
  ],
  templateUrl: './profile-edit-dialog.component.html',
  styleUrls: ['./profile-edit-dialog.component.scss']
})
export class ProfileEditDialogComponent implements OnInit {
  profileForm: FormGroup;
  isLoading: boolean = false;
  imageLoading: boolean = false;

  classes = [
    { value: 'Guerrero', label: 'warrior' },
    { value: 'Mago', label: 'mage' },
    { value: 'Explorador', label: 'explorer' },
    { value: 'Asesino', label: 'assassin' },
    { value: 'Paladín', label: 'paladin' },
    { value: 'Arquero', label: 'archer' },
    { value: 'Bárbaro', label: 'barbarian' },
    { value: 'Clérigo', label: 'cleric' },
    { value: 'Hechicero', label: 'sorcerer' },
    { value: 'Monje', label: 'monk' },
    { value: 'Bardo', label: 'bard' },
    { value: 'Druida', label: 'druid' },
    { value: 'Brujo', label: 'warlock' },
    { value: 'Soldado Arcano', label: 'arcane-soldier' },
    { value: 'Oficinista', label: 'clerk' },
    { value: 'Capitán Kendo', label: 'captain-kendo' }
  ];

  powers = [
    { value: 'Pyro', label: 'fire' },
    { value: 'Hydro', label: 'water' },
    { value: 'Geo', label: 'earth' },
    { value: 'Aero', label: 'air' },
    { value: 'Combat', label: 'combat' },
    { value: 'Electro', label: 'electro' }
  ];

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    public dialogRef: MatDialogRef<ProfileEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProfileEditDialogData
  ) {
    this.profileForm = this.fb.group({
      username: [this.data.profile.username, [Validators.required, Validators.minLength(3)]],
      clase: [this.data.profile.clase, Validators.required],
      power: [this.data.profile.power, Validators.required],
      level: [this.data.profile.level, [Validators.required, Validators.min(1), Validators.max(100)]],
      weapon: [this.data.profile.weapon],
      total_hp: [this.data.profile.total_hp, [Validators.required, Validators.min(1)]],
      current_hp: [this.data.profile.current_hp, [Validators.required, Validators.min(0)]],
      attack: [this.data.profile.attack, [Validators.required, Validators.min(1)]],
      defense: [this.data.profile.defense, [Validators.required, Validators.min(1)]],
      special_attack: [this.data.profile.special_attack || 1, [Validators.required, Validators.min(1)]],
      special_defense: [this.data.profile.special_defense || 1, [Validators.required, Validators.min(1)]],
      speed: [this.data.profile.speed || 1, [Validators.required, Validators.min(1)]],
      image_url: [this.data.profile.image_url]
    });
  }

  ngOnInit(): void {
    // Ensure current HP doesn't exceed total HP
    this.profileForm.get('total_hp')?.valueChanges.subscribe(totalHp => {
      const currentHp = this.profileForm.get('current_hp')?.value;
      if (currentHp > totalHp) {
        this.profileForm.patchValue({ current_hp: totalHp });
      }
    });

    // Handle image URL changes for preview loading
    this.profileForm.get('image_url')?.valueChanges.subscribe(imageUrl => {
      if (imageUrl && imageUrl.trim()) {
        this.imageLoading = true;
      } else {
        this.imageLoading = false;
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.valid && !this.isLoading) {
      this.isLoading = true;

      try {
        const updatedProfile: Profile = {
          ...this.data.profile,
          ...this.profileForm.value
        };

        const result = await this.supabaseService.updateProfile(updatedProfile);
        
        if (result.error) {
          throw result.error;
        }

        this.dialogRef.close(result.data[0]);
      } catch (error) {
        console.error('Error updating profile:', error);
        // You might want to show an error message here
      } finally {
        this.isLoading = false;
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Helper method to sync current HP when total HP changes
  onTotalHpChange(): void {
    const totalHp = this.profileForm.get('total_hp')?.value;
    const currentHp = this.profileForm.get('current_hp')?.value;
    
    if (currentHp > totalHp) {
      this.profileForm.patchValue({ current_hp: totalHp });
    }
  }

  // Handle image load errors
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = '/assets/icon.png';
    }
  }

  // Handle preview image loading
  onImageLoad(event: Event): void {
    this.imageLoading = false;
  }

  // Handle preview image errors
  onImagePreviewError(event: Event): void {
    this.imageLoading = false;
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = '/assets/icon.png';
    }
  }
}
