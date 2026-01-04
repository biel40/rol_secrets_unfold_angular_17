import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { LoaderService } from '../../services/loader/loader.service';


@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent {

  protected loaderService = inject(LoaderService);

}