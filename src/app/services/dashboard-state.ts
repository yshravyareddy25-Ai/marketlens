import { Injectable, inject, signal, computed } from '@angular/core';
import { MarketStreamService } from './market-stream';
import { marked } from 'marked';
import { StockQuote, StockService } from './stock';



export type StreamStatus = 'idle' | 'streaming' | 'done' | 'error';

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  private streamService = inject(MarketStreamService);



  // ---- reactive state, held in signals ----
  readonly query = signal('');
  readonly analysis = signal('');          // the text, growing token by token
  readonly status = signal<StreamStatus>('idle');
  readonly errorMsg = signal('');

  private stockService = inject(StockService);
  readonly quote = signal<StockQuote | null>(null);


  // ---- derived (computed) state ----
  // word count updates automatically as analysis grows
  readonly wordCount = computed(() =>
    this.analysis().trim() ? this.analysis().trim().split(/\s+/).length : 0
  );
  readonly isStreaming = computed(() => this.status() === 'streaming');

readonly panels = computed(() =>
    this.analysis()
      .split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => marked.parse(p) as string)
  );

  // ---- the action: start a streaming analysis ----
  analyze(query: string) {
    if (!query.trim() || this.isStreaming()) return;

    this.query.set(query.trim());
    this.analysis.set('');
    this.errorMsg.set('');
    this.status.set('streaming');

     this.stockService.resolveTicker(query.trim()).then(ticker => {
      if (ticker) {
        this.stockService.getQuote(ticker).then(q => this.quote.set(q));
      }
    });


    this.streamService.streamAnalysis(query.trim()).subscribe({
      // each token that arrives gets appended to the signal —
      // every component reading analysis() updates automatically
      next: (token) => this.analysis.update(text => text + token),
      error: (err) => {
        this.errorMsg.set(typeof err === 'string' ? err : 'Stream failed');
        this.status.set('error');
      },
      complete: () => this.status.set('done'),
    });
  }

  reset() {
    this.query.set('');
    this.analysis.set('');
    this.status.set('idle');
    this.errorMsg.set('');
  }


}