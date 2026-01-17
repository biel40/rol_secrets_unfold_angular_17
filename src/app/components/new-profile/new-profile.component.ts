import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../services/user/user.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-new-profile',
    templateUrl: './new-profile.component.html',
    styleUrls: ['./new-profile.component.scss'],
    standalone: true,
    imports: [

    ]
})
export class NewProfileComponent implements OnInit {

    private _userService = inject(UserService);
    private _router = inject(Router);

    constructor() { }

    async ngOnInit(): Promise<void> {

    }

    public async signOut(): Promise<void> {
        await this._userService.signOut();
        this._router.navigate(['']);
    }
}