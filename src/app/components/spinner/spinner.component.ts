import { Component, inject, ViewEncapsulation } from '@angular/core';
import { LoaderService } from '../../services/loader/loader.service';


@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  standalone: true,
  imports : [
    
  ],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class SpinnerComponent {

  public loaderService = inject(LoaderService);

  constructor() {

  }
}