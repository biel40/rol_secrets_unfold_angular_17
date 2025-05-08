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
     * Roll the dice with simple animation and visual feedback
     */
    public rollDice() {
        // Don't allow rolling while already rolling
        if (this.isRolling) return;
        
        // Set rolling state
        this.isRolling = true;
        
        // Reset damage display
        this.damage = 0;
        const damageDisplay = document.querySelector('.damage-display');
        if (damageDisplay) {
            damageDisplay.classList.remove('damage-calculated');
        }
        
        // Generate random number for the dice (1-6)
        const rolledNumber = this.getRandomNumber(1, 6);
        console.log('Generated random number:', rolledNumber);
        
        // Get dice elements
        const diceWrapper = document.querySelector('.dice-wrapper');
        const dice = document.querySelector('.dice') as HTMLElement | null;
        
        if (!dice || !diceWrapper) {
            console.error('Dice elements not found');
            this.isRolling = false;
            return;
        }
        
        diceWrapper.classList.add('rolling');
        

        const animationDuration = 1500;
        
        setTimeout(() => {
            diceWrapper.classList.remove('rolling');
            
            this.diceNumber = rolledNumber;
            
            this._calculateDamage();
            
            this.isRolling = false;
        }, animationDuration);
    }
    
    /**
     * Calculate damage based on dice roll and character stats
     */
    private async _calculateDamage() {
        console.log('Calculating damage for dice number:', this.diceNumber);

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

                console.log('Final calculated damage:', damage);
                
                // Set the damage value
                this.damage = damage;
                
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

    // This method is no longer needed with the simplified dice implementation

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