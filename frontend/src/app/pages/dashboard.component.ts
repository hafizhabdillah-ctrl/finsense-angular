import { CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { SettingsComponent } from '../components/settings.component';
import { environment } from '../core/environment';
import { forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { NAV_LINKS } from '../core/nav-icons';

interface DashboardTransaction {
  id: string;
  transaction_date: string;
  amount: number;
  description?: string;
  type: 'income' | 'expense';
}

interface DashboardProduct {
  id: string;
  stock: number;
  min_stock: number;
}

interface DashboardDebt {
  total_debt: number;
  paid_amount: number;
  status: string;
}

interface BestSeller {
  product: string;
  total_sold?: number;
  total_terjual?: number;
  is_top_seller?: boolean;
  probability?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SettingsComponent, CurrencyPipe, LucideAngularModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  readonly http = inject(HttpClient);
  readonly router = inject(Router);
  readonly links = NAV_LINKS;
  settingsOpen = false;
  sidebarOpen = false;
  transactions: DashboardTransaction[] = [];
  products: DashboardProduct[] = [];
  debts: DashboardDebt[] = [];
  bestSellers: BestSeller[] = [];
  loading = true;
  error = '';

  constructor() {
    this.loadDashboardData();
  }

  get today(): string {
    return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  get todayIncome(): number {
    return this.todayTransactions.filter((item) => item.type === 'income').reduce((total, item) => total + Number(item.amount), 0);
  }

  get todayTransactions(): DashboardTransaction[] {
    const today = new Date().toDateString();
    return this.transactions.filter((item) => new Date(item.transaction_date).toDateString() === today);
  }

  get averageOrder(): number {
    const count = this.todayTransactions.length;
    return count ? this.todayIncome / count : 0;
  }

  get lowStock(): number { return this.products.filter((product) => product.stock <= product.min_stock).length; }
  get activeDebt(): number { return this.debts.filter((debt) => debt.status !== 'paid').reduce((total, debt) => total + Number(debt.total_debt) - Number(debt.paid_amount || 0), 0); }

  get weeklySales(): { label: string; amount: number }[] {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      const key = date.toDateString();
      return { label: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }), amount: this.transactions.filter((item) => item.type === 'income' && new Date(item.transaction_date).toDateString() === key).reduce((total, item) => total + Number(item.amount), 0) };
    });
  }

  get weeklyMax(): number { return Math.max(...this.weeklySales.map((item) => item.amount), 1); }

  private loadDashboardData(): void {
    forkJoin({
      transactions: this.http.get<DashboardTransaction[]>(`${environment.apiUrl}/transactions`),
      products: this.http.get<DashboardProduct[]>(`${environment.apiUrl}/products`),
      debts: this.http.get<DashboardDebt[]>(`${environment.apiUrl}/debts`),
    }).subscribe({
      next: (data) => { this.transactions = data.transactions; this.products = data.products; this.debts = data.debts; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.error = 'Sebagian data dashboard gagal dimuat.'; this.loading = false; this.cdr.markForCheck(); },
    });
    this.http.get<{ top_products?: BestSeller[] }>(`${environment.apiUrl}/ai/real-top-products`).subscribe({
      next: (data) => { this.bestSellers = data.top_products || []; this.cdr.markForCheck(); },
      error: () => { this.cdr.markForCheck(); }
    });
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    window.location.assign('/login');
  }
}
