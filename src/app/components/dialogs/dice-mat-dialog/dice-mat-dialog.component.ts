import { afterNextRender, Component, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { TranslocoModule } from '@jsverse/transloco';
import { MaterialModule } from '../../../modules/material.module';
import { Hability, Profile, SupabaseService } from '../../../services/supabase/supabase.service';

@Component({
    selector: 'app-dice-mat-dialog',
    templateUrl: './dice-mat-dialog.component.html',
    styleUrls: ['./dice-mat-dialog.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MaterialModule,
        TranslocoModule,
        MatDialogClose,
        MatDialogTitle
    ]
})
export class DiceMatDialogComponent {

    private _supabaseService: SupabaseService = inject(SupabaseService);

    // Use signals for reactive state
    public readonly profile = signal<Profile | null>(null);
    public readonly diceNumber = signal<number>(1);
    public readonly damage = signal<number>(0);
    public readonly hability = signal<Hability | null>(null);
    public readonly isRolling = signal<boolean>(false);
    public readonly isReady = signal<boolean>(false);

    constructor(
        public dialogRef: MatDialogRef<DiceMatDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: { hability: Hability; profile: Profile | null },
    ) {
        // Initialize from dialog data synchronously
        this.hability.set(this.data?.hability ?? null);
        this.profile.set(this.data?.profile ?? null);

        // Use afterNextRender to roll dice after the view is fully rendered
        // This avoids NG0100 errors by running outside change detection
        afterNextRender(() => {
            this.isReady.set(true);
            this.rollDice();
        });
    }

    public rollDice() {
        if (this.isRolling()) return;
        
        this.isRolling.set(true);
        this.damage.set(0);
        
        const damageDisplay = document.querySelector('.damage-display');
        if (damageDisplay) {
            damageDisplay.classList.remove('damage-calculated');
        }
        
        const rolledNumber = this.getRandomNumber(1, 6);
        console.log('Generated random number:', rolledNumber);
        
        const simpleDice = document.querySelector('.simple-dice');
        
        if (!simpleDice) {
            console.error('Dice element not found');
            this.isRolling.set(false);
            return;
        }
        
        simpleDice.classList.add('rolling');
        
        const animationDuration = 1000;
        
        setTimeout(() => {
            simpleDice.classList.remove('rolling');
            
            this.diceNumber.set(rolledNumber);
            
            this._calculateDamage();
            
            this.isRolling.set(false);
        }, animationDuration);
    }
    
    /**
     * Calculate damage based on dice roll and character stats
     */
    private async _calculateDamage() {
        const currentHability = this.hability();
        const currentProfile = this.profile();
        const currentDiceNumber = this.diceNumber();
        
        console.log('Calculating damage for dice number:', currentDiceNumber);

        if (currentHability) {
            // Decrement ability uses
            currentHability.current_uses--;

            // Update ability in database
            await this._supabaseService.updateHability(currentHability);

            let calculatedDamage: number = 0;

            if (currentProfile && currentProfile.attack != undefined) {
                // Base damage is dice roll + attack stat
                calculatedDamage = currentDiceNumber + currentProfile.attack;

                // Add weapon bonus
                if (
                    currentProfile.weapon === 'Espada' ||
                    currentProfile.weapon === 'Dagas'
                ) {
                    calculatedDamage += 2;
                }

                // Add class bonus
                if (currentProfile.clase === 'Guerrero') {
                    calculatedDamage += 2;
                } else if (currentProfile.clase === 'Pícaro') {
                    calculatedDamage += 1;
                }

                console.log('Final calculated damage:', calculatedDamage);
                
                // Set the damage value
                this.damage.set(calculatedDamage);
                
                // Show the damage display with animation
                setTimeout(() => {
                    const damageDisplay = document.querySelector('.damage-display');
                    if (damageDisplay) {
                        damageDisplay.classList.add('damage-calculated');
                    }
                }, 300);
            }
        }
    }

    /**
     * Generate a random number between min and max (inclusive)
     */
    public getRandomNumber(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Close the dialog
     */
    public closeDialog() {
        this.dialogRef.close();
    }
}