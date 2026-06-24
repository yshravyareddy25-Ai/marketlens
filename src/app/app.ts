import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardStateService } from './services/dashboard-state';
import { StockChart } from './components/stock-chart/stock-chart';
import { ApiKeysService } from './services/api-keys';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, StockChart],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // bring in our state service — the component reads everything from it
  state = inject(DashboardStateService);

  keys = inject(ApiKeysService);


  query = '';

  run() {
    this.state.analyze(this.query);
  }
}