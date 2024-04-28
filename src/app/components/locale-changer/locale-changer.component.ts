import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AvailableLangs, LangDefinition, TranslocoService } from '@jsverse/transloco';
import { TranslocoModule } from '@ngneat/transloco';
import { Subscription, take } from 'rxjs';

@Component({
    selector: 'app-locale-changer',
    templateUrl: './locale-changer.component.html',
    styleUrls: ['./locale-changer.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TranslocoModule
    ]
})
export class LocaleChangerComponent {

    private _translocoService: TranslocoService = inject(TranslocoService);

    public selectedLocale: string = "es";
    public locales: AvailableLangs = this._translocoService.getAvailableLangs();
    private subscription: Subscription | null = null;

    constructor() {
        this.selectedLocale = this._translocoService.getActiveLang();
    }

    public changeLocale() {

        let lang = this.selectedLocale;

        this.subscription?.unsubscribe();

        this.subscription = this._translocoService
            .load(lang)
            .pipe(take(1))
            .subscribe(() => {
                this._translocoService.setActiveLang(lang);
            });
    }

    public getLocaleText(locale: string | LangDefinition): string {
        switch (locale) {

            case 'es': return 'Español';
            case 'en': return 'English';
            case 'fr': return 'Français';
            case 'de': return 'Deutsch';
            case 'it': return 'Italiano';
            case 'pt': return 'Português';
            case 'ja': return '日本語';
            case 'ko': return '한국어';
            case 'zh': return '中文';
            default: return 'Unknown';
        }
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
        this.subscription = null;
    }


}
