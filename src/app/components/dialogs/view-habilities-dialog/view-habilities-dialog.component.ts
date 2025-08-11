import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../modules/material.module';
import { TranslocoModule } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Hability, Profile } from '../../../services/supabase/supabase.service';

@Component({
  selector: 'app-view-habilities-dialog',
  templateUrl: './view-habilities-dialog.component.html',
  styleUrls: ['./view-habilities-dialog.component.scss'],
  standalone: true,
  imports: [
    MaterialModule,
    TranslocoModule,
    CommonModule
  ]
})
export class ViewHabilitiesDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ViewHabilitiesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { profile: Profile, habilities: Hability[] }
  ) {}

  public onClose(): void {
    this.dialogRef.close();
  }

  // Get power (icon and color) for habilities
  public getPowerTheme(powerType: string | undefined): { icon: string, color: string, bgColor: string } {
    if (!powerType) {
      return { icon: '⭐', color: '#95a5a6', bgColor: 'rgba(149, 165, 166, 0.1)' };
    }

    const normalizedPowerType = powerType.trim().toLowerCase();

    const themes: { [key: string]: { icon: string, color: string, bgColor: string } } = {
      'pyro': { icon: '🔥', color: '#e74c3c', bgColor: 'rgba(231, 76, 60, 0.1)' },
      'hydro': { icon: '💧', color: '#3498db', bgColor: 'rgba(52, 152, 219, 0.1)' },
      'geo': { icon: '🪨', color: '#8b4513', bgColor: 'rgba(139, 69, 19, 0.1)' },
      'electro': { icon: '⚡', color: '#9b59b6', bgColor: 'rgba(155, 89, 182, 0.1)' },
      'cryo': { icon: '❄️', color: '#74b9ff', bgColor: 'rgba(116, 185, 255, 0.1)' },
      'natura': { icon: '🌿', color: '#27ae60', bgColor: 'rgba(39, 174, 96, 0.1)' },
      'aero': { icon: '🌪️', color: '#00cec9', bgColor: 'rgba(0, 206, 201, 0.1)' },
      'light': { icon: '✨', color: '#f39c12', bgColor: 'rgba(243, 156, 18, 0.1)' },
      'dark': { icon: '🌑', color: '#2c3e50', bgColor: 'rgba(44, 62, 80, 0.1)' },
      'universal': { icon: '🌌', color: '#8e44ad', bgColor: 'rgba(142, 68, 173, 0.1)' }
    };

    return themes[normalizedPowerType] || { icon: '⭐', color: '#95a5a6', bgColor: 'rgba(149, 165, 166, 0.1)' };
  }

  public getUsagePercentage(hability: Hability | undefined): number {
    if (!hability || !hability.current_uses || !hability.total_uses || hability.total_uses === 0) {
      return 0;
    }
    return Math.round((hability.current_uses / hability.total_uses) * 100);
  }

  public getUsageColor(percentage: number): string {
    if (isNaN(percentage) || percentage < 0) return '#9e9e9e'; // Gray for invalid values
    if (percentage >= 80) return '#4caf50'; // Green
    if (percentage >= 50) return '#ff9800'; // Orange
    if (percentage >= 20) return '#f44336'; // Red
    return '#9e9e9e'; // Gray
  }
}
