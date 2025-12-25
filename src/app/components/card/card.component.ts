import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ProfileInfoComponent } from '../profile-info/profile-info.component';

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

    constructor() { 

    }

    ngOnInit(): void {

    }

}