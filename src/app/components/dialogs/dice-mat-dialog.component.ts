import { Component, inject, Inject, OnInit } from '@angular/core';
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

        setTimeout(() => {
            this.rollDice();
        }, 100);
    }

    public rollDice() {
        const dice = [...document.querySelectorAll(".die-list") as any];

        dice.forEach(die => {
            this.toggleClasses(die);
            let randomNumber = this.getRandomNumber(1, 6);
            die.dataset.roll = randomNumber;
            this.diceNumber = randomNumber;

            this._calculateDamage();
        });
    }

    /*
    * This private method calculates the damage of the attack
    */
    private async _calculateDamage() {
        console.log('Calculating damage...');

        if (this.hability) {
            this.hability.current_uses--;

            await this._supabaseService.updateHability(this.hability);

            let damage: number = 0;

            if (
                this.profile && 
                this.profile.attack != undefined
            ) {

                damage = (this.diceNumber) + (this.profile.attack);

                if (
                    this.profile.weapon === 'Espada' ||
                    this.profile.weapon === 'Dagas'
                ) {
                    damage += 2;
                }

                if (this.profile.clase === 'Guerrero') {
                    damage += 2;
                } else if (this.profile.clase === 'Pícaro') {
                    damage += 1;
                }

                this.damage = damage;

                console.log('Total damage: ', this.damage);
                alert('Daño total: ' + this.damage);
            }
        }
    }

    public toggleClasses(die: any) {
        die.classList.toggle("odd-roll");
        die.classList.toggle("even-roll");
    }

    public getRandomNumber(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public closeDialog() {
        this.dialogRef.close();
    }

}