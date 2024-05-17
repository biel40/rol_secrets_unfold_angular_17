import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ProfileInfoComponent } from '../profile-info/profile-info.component';
import { ProfileService } from '../../services/profile/profile.service';
import { ProfileStatsComponent } from '../profile-stats/profile-stats.component';
import { NgTiltModule } from '@geometricpanda/angular-tilt';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'app-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.scss'],
    standalone: true,
    imports: [
        CommonModule, 
        ProfileInfoComponent,
        ProfileStatsComponent,
        NgTiltModule,
        RouterLink,
        TranslocoModule
    ]
})
export class CardComponent implements OnInit {

    private _profileService: ProfileService = inject(ProfileService);

    constructor() { 

    }

    ngOnInit(): void {

    }

}