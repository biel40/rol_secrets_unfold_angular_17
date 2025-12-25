import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  private _loading = signal<boolean>(false);
  
  // Expose as readonly signal
  public readonly loading = this._loading.asReadonly();

  constructor() { }

  setLoading(loading: boolean) {
    this._loading.set(loading);
  }

  getLoading(): boolean {
    return this._loading();
  }
}