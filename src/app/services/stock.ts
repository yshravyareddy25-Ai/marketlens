import { inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiKeysService } from './api-keys';

export interface StockQuote {
  ticker: string;
  current: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
}

export interface PricePoint { date: Date; close: number; }


@Injectable({ providedIn: 'root' })
export class StockService {

      private apiKeys = inject(ApiKeysService);


  // built-in map for the common companies you'll demo with — reliable + instant
  private tickerMap: Record<string, string> = {
    tesla: 'TSLA', apple: 'AAPL', nvidia: 'NVDA', microsoft: 'MSFT',
    amazon: 'AMZN', google: 'GOOGL', alphabet: 'GOOGL', meta: 'META',
    facebook: 'META', netflix: 'NFLX', amd: 'AMD', intel: 'INTC',
    'jp morgan': 'JPM', jpmorgan: 'JPM', 'bank of america': 'BAC',
    walmart: 'WMT', disney: 'DIS', cocacola: 'KO', 'coca cola': 'KO',
    boeing: 'BA', ford: 'F', uber: 'UBER', airbnb: 'ABNB',
    paypal: 'PYPL', visa: 'V', mastercard: 'MA', starbucks: 'SBUX',
    nike: 'NKE', pfizer: 'PFE', exxon: 'XOM', chevron: 'CVX',
  };

  // turn a company name (or ticker) into a ticker symbol
  async resolveTicker(input: string): Promise<string | null> {
    const key = input.trim().toLowerCase();

    // 1. direct hit in our map
    if (this.tickerMap[key]) return this.tickerMap[key];

    // 2. if the user already typed a ticker-like string (e.g. "TSLA"), use it
    if (/^[A-Za-z]{1,5}$/.test(input.trim())) return input.trim().toUpperCase();

    // 3. fallback: ask Finnhub's symbol search
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(input)}&token=${this.apiKeys.finnhubKey()}`
      );
      const data = await res.json();
      if (data.result && data.result.length > 0) {
        return data.result[0].symbol;   // best match
      }
    } catch { /* ignore, fall through */ }
    return null;
  }

  // current price snapshot
  async getQuote(ticker: string): Promise<StockQuote | null> {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${this.apiKeys.finnhubKey()}`
      );
      const q = await res.json();
      if (q.c === 0) return null;   // Finnhub returns 0 for unknown tickers
      return {
        ticker,
        current: q.c, change: q.d, percentChange: q.dp,
        high: q.h, low: q.l,
      };
    } catch { return null; }
  }
}