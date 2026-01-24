import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ProfileInfoComponent } from '../profile-info/profile-info.component';
import { Profile } from '../../services/supabase/supabase.service';

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

    @Input() profile: Profile | null = null;

    constructor() { 

    }

    ngOnInit(): void {

    }

    public get elementClass(): string {
        if (!this.profile?.power) return '';
        return `element-${this.profile.power.toLowerCase()}`;
    }

}