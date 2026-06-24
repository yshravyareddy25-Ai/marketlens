import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MarketStreamService {

  /*
    Streams an AI financial analysis token-by-token.
    Returns an RxJS Observable that emits each text chunk as it arrives
    from the Anthropic streaming API (Server-Sent Events).

    This is the core engineering piece: we read a raw network stream,
    parse the SSE chunks, extract each token, and bridge it into RxJS
    so the rest of the app reacts to it the Angular way.
  */
  streamAnalysis(query: string): Observable<string> {
    const subject = new Subject<string>();

    const systemPrompt =
      'You are a financial analyst. Give a concise, structured market analysis ' +
      'of the topic. Use short paragraphs covering: overview, key drivers, risks, ' +
      'and outlook. Be factual and balanced. This is not financial advice.';

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': environment.anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        stream: true,                       // <-- ask for streaming
        system: systemPrompt,
        messages: [{ role: 'user', content: query }],
      }),
    })
      .then(async (response) => {
        if (!response.body) { subject.error('No response stream'); return; }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // read the stream chunk by chunk
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE sends lines separated by newlines; process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';      // keep the incomplete last line

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (!data || data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);
              // the token lives in content_block_delta events
              if (event.type === 'content_block_delta' && event.delta?.text) {
                subject.next(event.delta.text);   // emit the token into RxJS
              }
            } catch {
              // ignore non-JSON keep-alive lines
            }
          }
        }
        subject.complete();
      })
      .catch((err) => subject.error(err));

    return subject.asObservable();
  }
}