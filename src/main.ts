import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Suppress NavigatorLockAcquireTimeoutError by providing a no-op lock implementation
// This is needed because Supabase Auth v2.39.x has issues with Navigator Locks
if (typeof navigator !== 'undefined' && navigator.locks) {
  const originalRequest = navigator.locks.request.bind(navigator.locks);
  (navigator.locks as any).request = (name: string, optionsOrCallback: any, callback?: any): Promise<any> => {
    const cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
    return Promise.resolve().then(() => cb({ name, mode: 'exclusive' }));
  };
}

bootstrapApplication(AppComponent, appConfig)
  .catch((error) => console.error(error));
