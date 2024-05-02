import { Component, inject, OnInit } from '@angular/core';
import { SupabaseService } from '../../services/supabase/supabase.service';
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

    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _router = inject(Router);

    constructor() { }

    async ngOnInit(): Promise<void> {

    }

    public async signOut() {
        await this._supabaseService.signOut();
        this._router.navigate(['']);
    }
}