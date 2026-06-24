import { Component, ElementRef, ViewChild, AfterViewInit, Input, OnChanges } from '@angular/core';
import * as d3 from 'd3';
import { StockQuote } from '../../services/stock';

@Component({
  selector: 'app-stock-chart',
  standalone: true,
  imports: [],
  template: `<div #chart class="chart-host"></div>`,
  styles: [`.chart-host { width: 100%; }`],
})
export class StockChart implements OnChanges, AfterViewInit {
  @Input() quote: StockQuote | null = null;
  @ViewChild('chart', { static: true }) chartRef!: ElementRef;

  ngAfterViewInit() { this.draw(); }
  ngOnChanges() { this.draw(); }

  private draw() {
    if (!this.quote || !this.chartRef) return;
    const q = this.quote;

    const host = d3.select(this.chartRef.nativeElement);
    host.selectAll('*').remove();

    const width = 520, height = 120;
    const margin = { left: 70, right: 70 };
    const innerW = width - margin.left - margin.right;

    const svg = host.append('svg')
      .attr('width', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`);

    // THE SCALE: price ($) -> pixels
    const x = d3.scaleLinear()
      .domain([q.low, q.high])
      .range([margin.left, margin.left + innerW]);

    const midY = height / 2;
    const up = q.change >= 0;
    const color = up ? '#3fb9a0' : '#ff7b72';

    // range track
    svg.append('line')
      .attr('x1', x(q.low)).attr('x2', x(q.high))
      .attr('y1', midY).attr('y2', midY)
      .attr('stroke', '#2a3344').attr('stroke-width', 6)
      .attr('stroke-linecap', 'round');

    // previous close marker
    const prevClose = q.current - q.change;
    if (prevClose >= q.low && prevClose <= q.high) {
      svg.append('line')
        .attr('x1', x(prevClose)).attr('x2', x(prevClose))
        .attr('y1', midY - 14).attr('y2', midY + 14)
        .attr('stroke', '#6b7689').attr('stroke-width', 2).attr('stroke-dasharray', '3,3');
    }

    // current price dot
    svg.append('circle')
      .attr('cx', x(q.current)).attr('cy', midY)
      .attr('r', 8).attr('fill', color);

    // low / high labels
    svg.append('text').attr('x', x(q.low)).attr('y', midY + 28)
      .attr('text-anchor', 'middle').attr('fill', '#6b7689').attr('font-size', '11')
      .text(`$${q.low.toFixed(2)}`);
    svg.append('text').attr('x', x(q.high)).attr('y', midY + 28)
      .attr('text-anchor', 'middle').attr('fill', '#6b7689').attr('font-size', '11')
      .text(`$${q.high.toFixed(2)}`);

    // current price label
    svg.append('text').attr('x', x(q.current)).attr('y', midY - 16)
      .attr('text-anchor', 'middle').attr('fill', color).attr('font-size', '13').attr('font-weight', '700')
      .text(`$${q.current.toFixed(2)}`);

    // ticker + change
    svg.append('text').attr('x', 8).attr('y', 18)
      .attr('fill', '#e6edf3').attr('font-size', '14').attr('font-weight', '700')
      .text(q.ticker);
    svg.append('text').attr('x', 8).attr('y', 34)
      .attr('fill', color).attr('font-size', '12')
      .text(`${up ? '+' : ''}${q.change.toFixed(2)} (${q.percentChange.toFixed(2)}%)`);
  }
}