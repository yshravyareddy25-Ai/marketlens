# 📈 MarketLens — Real-Time AI Financial Insights Dashboard

**An Angular dashboard that streams AI-generated market analysis token-by-token into a live, reactive UI — paired with real-time stock data and a custom D3 visualization.**

MarketLens combines **LLM application engineering** with **modern reactive frontend architecture**. You enter a company or market topic, and an AI analysis streams in live — word by word — alongside the stock's real trading data, rendered in a hand-built D3 chart.

🔗 **Live demo:** https://marketlens-ai-ruby.vercel.app/

---

## What it does

1. Enter a company or topic (e.g. "Tesla", "Google", "interest rate impact on banks")
2. The app calls the Claude API in **streaming mode** — the analysis appears token-by-token, like live typing, structured into Overview, Key Drivers, Risks, and Outlook
3. In parallel, it resolves the company to a stock ticker and fetches **live quote data**
4. A custom **D3 chart** shows the stock's current price within today's trading range, with the previous close as a reference marker

---

## Why it's technically interesting

This project is built around the **hard parts** of modern frontend engineering:

- **Real-time streaming with RxJS** — the streaming service reads a raw network stream (Server-Sent Events) from the Claude API, parses each chunk, and bridges it into an RxJS `Subject`, so tokens flow through the app reactively as they arrive.
- **Reactive state with Angular Signals** — application state (the accumulating analysis, status, stock quote) lives in signals. As each token arrives it's appended to a signal, and the UI re-renders automatically. Derived values (word count, paragraph panels) are computed signals that stay in sync without manual updates.
- **Unidirectional data flow** — an action updates signal state, and components react to it — the same principle as NgRx/Redux, implemented with Angular's newer signals primitive.
- **Custom D3 visualization** — the stock chart is built directly with D3 (scales, SVG, positioning), not a charting library. A linear scale maps price values to pixel positions to place the current-price marker within the day's low–high range.

---

## The streaming engine (core piece)

The streaming service turns the Claude API's token stream into an RxJS Observable:

```typescript
streamAnalysis(query: string): Observable<string> {
  const subject = new Subject<string>();

  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { /* api key, version, json */ },
    body: JSON.stringify({ model, stream: true, system, messages }),
  }).then(async (response) => {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const event = JSON.parse(line.slice(5).trim());
        if (event.type === 'content_block_delta' && event.delta?.text) {
          subject.next(event.delta.text);   // emit each token into RxJS
        }
      }
    }
    subject.complete();
  }).catch(err => subject.error(err));

  return subject.asObservable();
}
```

The state service consumes that stream and appends each token to a signal:

```typescript
this.streamService.streamAnalysis(query).subscribe({
  next: (token) => this.analysis.update(text => text + token),
  complete: () => this.status.set('done'),
  error: () => this.status.set('error'),
});
```

Because `analysis` is a signal, every component reading it re-renders automatically as tokens arrive — that's what produces the live streaming effect.

---

## The D3 chart

The free market-data tier exposes only the **daily quote** (current, open, high, low, previous close) — not historical candles. Rather than force a line chart the data couldn't support, MarketLens uses a **range visualization** designed around the available data: a track from the day's low to high, with the current price placed by a D3 linear scale, and the previous close shown only when it falls within the day's range.

```typescript
const x = d3.scaleLinear()
  .domain([quote.low, quote.high])     // price range in dollars
  .range([margin.left, margin.left + innerW]);  // pixel range on screen

svg.append('circle').attr('cx', x(quote.current)); // place dot at the price's pixel
```

This is a deliberate engineering choice — working honestly within data constraints rather than faking historical data.

---

## Tech stack

- **Angular 22** (standalone components, Signals)
- **RxJS** — streaming and async data flow
- **D3.js** — custom data visualization
- **Anthropic Claude API** — streaming AI analysis
- **Finnhub API** — live stock quote data
- **marked** — markdown rendering
- **TypeScript, SCSS**

---

## Run it locally

```bash
# 1. install dependencies
npm install

# 2. add your API keys
#    create src/environments/environment.ts with:
#      export const environment = {
#        anthropicApiKey: 'sk-ant-...',
#        finnhubApiKey: '...'
#      };
#    (this file is gitignored — keys are never committed)

# 3. run
ng serve
```

Then open `http://localhost:4200` and enter a company name.

> The environment file holding API keys is excluded from version control. For a
> production deployment, the API calls would route through a backend proxy so
> keys are never exposed to the browser.

---

## Project structure

```
src/app/
├── app.ts / app.html / app.scss        # dashboard component
├── services/
│   ├── market-stream.ts                # RxJS streaming engine
│   ├── dashboard-state.ts              # signals-based state
│   └── stock.ts                        # ticker resolution + quote fetch
└── components/
    └── stock-chart/                    # custom D3 range chart
```

---

## Roadmap

- Multi-day price history with a line chart (requires a historical-data API tier)
- Multiple watchlist tickers side by side
- Caching of recent analyses
- Backend proxy for API calls (production key handling)

---

_Built by Shravya Reddy — frontend & QA engineer building with LLMs._