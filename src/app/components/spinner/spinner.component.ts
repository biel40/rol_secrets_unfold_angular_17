import { Component, computed, inject } from '@angular/core';
import { LoaderService } from '../../services/loader/loader.service';


@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  standalone: true,
  imports : [
    
  ]
})
export class SpinnerComponent {

  private _loaderService = inject(LoaderService);
  
  public isLoading = computed(() => this._loaderService.loading());

  constructor() {

  }
}