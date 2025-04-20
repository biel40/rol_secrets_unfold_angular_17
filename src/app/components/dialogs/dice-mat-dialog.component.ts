import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material.module';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { TranslocoModule } from '@jsverse/transloco';
import { Hability, Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { UserService } from '../../services/user/user.service';
import { User } from '@supabase/supabase-js';

@Component({
    selector: 'app-dice-mat-dialog',
    templateUrl: './dice-mat-dialog.component.html',
    styleUrls: ['./dice-mat-dialog.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MaterialModule,
        TranslocoModule
    ]
})
export class DiceMatDialogComponent implements OnInit {

    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _userService: UserService = inject(UserService);

    public profile: Profile | null = null;
    private _user: User | null = null;
    public diceNumber: number = 0;
    public damage: number = 0;
    public hability: Hability | null = null;
    public isRolling: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<DiceMatDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: any,
    ) {

    }

    public async ngOnInit(): Promise<void> {

        this.hability = this.data?.hability;

        this._user = this._userService.getUser();

        if (this._user) {
            let profile = (await this._supabaseService.getProfileInfo(this._user.id)).data;

            if (profile) {
                this.profile = profile;
            }
        }

        // Small delay to ensure component is fully rendered
        setTimeout(() => {
            this.rollDice();
        }, 300);
    }

    /**
     * Roll the dice with enhanced 3D animation and visual feedback
     */
    public rollDice() {
        // Get elements
        const diceWrapper = document.querySelector('.dice-wrapper');
        const dice = document.querySelector('.dice');
        const damageDisplay = document.querySelector('.damage-display');
        
        // Set rolling state
        this.isRolling = true;
        
        // Reset damage display
        this.damage = 0;
        if (damageDisplay) {
            damageDisplay.classList.remove('damage-calculated');
        }
        
        // Generate random number for the dice
        this.diceNumber = this.getRandomNumber(1, 6);
        
        // Add rolling animation
        if (diceWrapper) {
            // Remove animation if it exists (to restart it)
            diceWrapper.classList.remove('rolling');
            
            // Force reflow to restart animation
            void (diceWrapper as HTMLElement).offsetWidth;
            
            // Add rolling animation
            diceWrapper.classList.add('rolling');
        }

        // Calculate damage after animation completes and set final dice position
        setTimeout(() => {
            this._calculateDamage();
            this._setFinalDicePosition();
            this.isRolling = false;
            
            // Add damage-calculated class to the damage display
            if (damageDisplay) {
                damageDisplay.classList.add('damage-calculated');
            }
        }, 1500); // Match this with the CSS animation duration
    }
    
    /**
     * Set the final position of the dice based on the rolled number
     * Each face of the dice corresponds to a specific rotation
     */
    private _setFinalDicePosition() {
        const dice = document.querySelector('.dice');
        if (!dice) return;
        
        // Define rotations for each face to show the correct number
        // These rotations ensure the correct face is shown facing up
        const rotations = {
            1: 'rotateX(0deg) rotateY(0deg)', // Front face (1)
            2: 'rotateX(90deg) rotateY(0deg)', // Top face (2)
            3: 'rotateX(0deg) rotateY(90deg)', // Right face (3)
            4: 'rotateX(0deg) rotateY(-90deg)', // Left face (4)
            5: 'rotateX(-90deg) rotateY(0deg)', // Bottom face (5)
            6: 'rotateX(0deg) rotateY(180deg)' // Back face (6)
        };
        
        // Apply the rotation for the current dice number
        (dice as HTMLElement).style.transform = rotations[this.diceNumber as keyof typeof rotations];
    }

    /**
     * Calculate damage based on dice roll and character stats
     */
    private async _calculateDamage() {
        console.log('Calculating damage...');

        if (this.hability) {
            // Decrement ability uses
            this.hability.current_uses--;

            // Update ability in database
            await this._supabaseService.updateHability(this.hability);

            let damage: number = 0;

            if (
                this.profile && 
                this.profile.attack != undefined
            ) {
                // Base damage is dice roll + attack stat
                damage = (this.diceNumber) + (this.profile.attack);

                // Add weapon bonus
                if (
                    this.profile.weapon === 'Espada' ||
                    this.profile.weapon === 'Dagas'
                ) {
                    damage += 2;
                }

                // Add class bonus
                if (this.profile.clase === 'Guerrero') {
                    damage += 2;
                } else if (this.profile.clase === 'Pícaro') {
                    damage += 1;
                }

                // Set final damage value with a slight delay for visual effect
                setTimeout(() => {
                    this.damage = damage;
                    
                    // Add damage-calculated class to the damage display element
                    const damageDisplay = document.querySelector('.damage-display');
                    if (damageDisplay) {
                        damageDisplay.classList.add('damage-calculated');
                    }
                }, 200);
            }
        }
    }

    /**
     * Toggle die animation classes
     */
    public toggleClasses(die: any) {
        die.classList.toggle("odd-roll");
        die.classList.toggle("even-roll");
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