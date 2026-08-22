import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../core/environment';
import { AuthService } from '../core/auth.service';
import { SettingsComponent } from '../components/settings.component';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  min_stock: number;
  unit?: string;
  price?: number;
}

interface StockLog {
  id: string;
  created_at: string;
  type: 'in' | 'out' | 'adjust';
  quantity: number;
  operator: string;
  status: string;
  product?: { name: string; sku: string };
}

interface Transaction {
  id: string;
  transaction_date: string;
  amount: number;
  description?: string;
  type: 'income' | 'expense';
  category?: { name: string };
}

interface Debt {
  id: string;
  customer_name: string;
  total_debt: number;
  paid_amount: number;
  due_date: string;
  status: string;
  note?: string;
}

@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, DatePipe, CurrencyPipe, SettingsComponent],
  templateUrl: './feature.component.html',
})
export class FeatureComponent {
  readonly title = inject(ActivatedRoute).snapshot.data['title'] as string;
  readonly http = inject(HttpClient);
  readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly links = [
    { label: 'Dashboard', path: '/dashboard', icon: '▦' },
    { label: 'Catatan Keuangan', path: '/transactions', icon: '▣' },
    { label: 'Manajemen Stok', path: '/stocks', icon: '▤' },
    { label: 'POS Terminal', path: '/pos', icon: '▥' },
    { label: 'Hutang & Pelanggan', path: '/debts', icon: '♟' },
    { label: 'Log Inventori', path: '/logs', icon: '☷' },
  ];
  products: Product[] = [];
  logs: StockLog[] = [];
  transactions: Transaction[] = [];
  debts: Debt[] = [];
  cart: Product[] = [];
  search = '';
  loading = true;
  error = '';
  settingsOpen = false;

  constructor() {
    if (this.title === 'Stok Produk' || this.title === 'Point of Sale') this.loadProducts();
    if (this.title === 'Log Aktivitas') this.loadLogs();
    if (this.title === 'Transaksi') this.loadTransactions();
    if (this.title === 'Utang Piutang') this.loadDebts();
  }

  get filteredProducts(): Product[] {
    const query = this.search.toLowerCase().trim();
    return this.products.filter((product) => !query || product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query));
  }

  get filteredLogs(): StockLog[] {
    const query = this.search.toLowerCase().trim();
    return this.logs.filter((log) => !query || log.product?.name.toLowerCase().includes(query) || log.product?.sku.toLowerCase().includes(query));
  }

  get lowStock(): number { return this.products.filter((product) => product.stock <= product.min_stock).length; }
  get totalStockIn(): number { return this.logs.filter((log) => log.type === 'in').reduce((total, log) => total + log.quantity, 0); }
  get totalStockOut(): number { return this.logs.filter((log) => log.type === 'out').reduce((total, log) => total + log.quantity, 0); }
  get totalIncome(): number { return this.transactions.filter((item) => item.type === 'income').reduce((total, item) => total + Number(item.amount), 0); }
  get totalExpense(): number { return this.transactions.filter((item) => item.type === 'expense').reduce((total, item) => total + Number(item.amount), 0); }
  get totalDebt(): number { return this.debts.reduce((total, item) => total + Number(item.total_debt) - Number(item.paid_amount || 0), 0); }
  cartTotal(): number { return this.cart.reduce((total, product) => total + (product.price || 0), 0); }
  addToCart(product: Product): void { if (product.stock > 0) this.cart = [...this.cart, product]; }
  removeFromCart(index: number): void { this.cart = this.cart.filter((_, itemIndex) => itemIndex !== index); }

  private loadProducts(): void {
    this.http.get<Product[]>(`${environment.apiUrl}/products`).subscribe({
      next: (products) => { this.products = products; this.loading = false; },
      error: () => { this.error = 'Gagal memuat data produk.'; this.loading = false; },
    });
  }

  private loadLogs(): void {
    this.http.get<StockLog[]>(`${environment.apiUrl}/stock-logs`).subscribe({
      next: (logs) => { this.logs = logs; this.loading = false; },
      error: () => { this.error = 'Gagal memuat data log inventori.'; this.loading = false; },
    });
  }

  private loadTransactions(): void {
    this.http.get<Transaction[]>(`${environment.apiUrl}/transactions`).subscribe({
      next: (transactions) => { this.transactions = transactions; this.loading = false; },
      error: () => { this.error = 'Gagal memuat catatan keuangan.'; this.loading = false; },
    });
  }

  private loadDebts(): void {
    this.http.get<Debt[]>(`${environment.apiUrl}/debts`).subscribe({
      next: (debts) => { this.debts = debts; this.loading = false; },
      error: () => { this.error = 'Gagal memuat data hutang pelanggan.'; this.loading = false; },
    });
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.router.navigate(['/login']);
  }
}
