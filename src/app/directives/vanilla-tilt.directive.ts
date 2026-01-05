import { Directive, ElementRef, Input, AfterViewInit, OnDestroy, inject } from '@angular/core';
import VanillaTilt, { TiltOptions } from 'vanilla-tilt';

@Directive({
  selector: '[appVanillaTilt]',
  standalone: true
})
export class VanillaTiltDirective implements AfterViewInit, OnDestroy {
  private _el = inject(ElementRef);

  @Input() tiltOptions: TiltOptions = {
    max: 25,
    speed: 400,
    glare: true,
    'max-glare': 0.5
  };

  ngAfterViewInit() {
    VanillaTilt.init(this._el.nativeElement, this.tiltOptions);
  }

  ngOnDestroy() {
    if (this._el.nativeElement.vanillaTilt) {
      this._el.nativeElement.vanillaTilt.destroy();
    }
  }
}
