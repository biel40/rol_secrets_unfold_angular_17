import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoModule } from '@jsverse/transloco';
import { Hability, Profile, SupabaseService } from '../../services/supabase/supabase.service';

@Component({
    selector: 'app-dice-mat-dialog',
    templateUrl: './dice-mat-dialog.component.html',
    styleUrls: ['./dice-mat-dialog.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        MaterialModule,
        TranslocoModule
    ]
})
export class DiceMatDialogComponent {

    private _supabaseService = inject(SupabaseService);

    // Signals for reactive state
    public readonly profile = signal<Profile | null>(null);
    public readonly diceNumber = signal<number>(1);
    public readonly damage = signal<number>(0);
    public readonly hability = signal<Hability | null>(null);
    public readonly isRolling = signal<boolean>(false);
    public readonly isInitialized = signal<boolean>(false);

    // Computed signals for template bindings
    public readonly showDamage = computed(() => this.damage() > 0 && this.isInitialized());
    public readonly diceClass = computed(() => `show-${this.diceNumber()}`);

    constructor(
        public dialogRef: MatDialogRef<DiceMatDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { hability: Hability; profile: Profile | null },
    ) {
        // Set data from dialog immediately (synchronously)
        if (this.data?.hability) {
            this.hability.set(this.data.hability);
        }
        if (this.data?.profile) {
            this.profile.set(this.data.profile);
        }

        // Start dice roll after render is complete
        afterNextRender(() => {
            this.isInitialized.set(true);
            requestAnimationFrame(() => {
                this.rollDice();
            });
        });
    }

    public rollDice(): void {
        if (this.isRolling() || !this.isInitialized()) return;
        
        this.isRolling.set(true);
        this.damage.set(0);
        
        const rolledNumber = this._getRandomNumber(1, 6);
        
        const animationDuration = 1000;
        
        setTimeout(() => {
            this.diceNumber.set(rolledNumber);
            this.isRolling.set(false);
            this._calculateDamage();
        }, animationDuration);
    }
    
    private async _calculateDamage(): Promise<void> {
        const currentHability = this.hability();
        const currentProfile = this.profile();
        const currentDiceNumber = this.diceNumber();

        if (!currentHability || !currentProfile) return;

        // Decrement ability uses
        currentHability.current_uses--;

        // Update ability uses in database
        await this._supabaseService.updateHabilityUses(currentHability, currentProfile);

        let calculatedDamage = 0;

        if (currentProfile.attack !== undefined) {
            // Base damage is dice roll + attack stat
            calculatedDamage = currentDiceNumber + currentProfile.attack;

            // Add weapon bonus
            if (currentProfile.weapon === 'Espada' || currentProfile.weapon === 'Dagas') {
                calculatedDamage += 2;
            }

            // Add class bonus
            if (currentProfile.clase === 'Guerrero') {
                calculatedDamage += 2;
            } else if (currentProfile.clase === 'Pícaro') {
                calculatedDamage += 1;
            }

            this.damage.set(calculatedDamage);
        }
    }

    private _getRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public closeDialog(): void {
        this.dialogRef.close();
    }
}