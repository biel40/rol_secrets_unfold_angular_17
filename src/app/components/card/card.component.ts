import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ProfileInfoComponent } from '../profile-info/profile-info.component';
import { Profile } from '../../services/supabase/supabase.service';
import { ProfileStateService } from '../../services/profile/profile-state.service';

@Component({
    selector: 'app-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.scss'],
    standalone: true,
    imports: [
        CommonModule, 
        ProfileInfoComponent
    ]
})
export class CardComponent implements OnInit {

    private _profileState = inject(ProfileStateService);

    public get profile(): Profile | null {
        return this._profileState.profile();
    }

    constructor() { 

    }

    ngOnInit(): void {

    }

    public get elementClass(): string {
        if (!this.profile?.power) return '';
        return `element-${this.profile.power.toLowerCase()}`;
    }

}