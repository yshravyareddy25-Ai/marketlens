import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiKeysService {
  readonly anthropicKey = signal('');
  readonly finnhubKey = signal('');

  get hasKeys() {
    return this.anthropicKey().trim() !== '' && this.finnhubKey().trim() !== '';
  }
}