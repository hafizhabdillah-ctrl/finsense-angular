import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../core/environment';
import { AuthService } from '../core/auth.service';
import { SettingsComponent } from '../components/settings.component';
import { finalize, forkJoin, of, switchMap } from 'rxjs';

interface Product {
  id: string;
  name: string;
  sku?: string;
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

interface Category {
  id: number;
  name: string;
  type?: 'income' | 'expense';
}

@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, DatePipe, CurrencyPipe, SettingsComponent],
  templateUrl: './feature.component.html',
})
export class FeatureComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  readonly route = inject(ActivatedRoute);
  title = '';
  readonly http = inject(HttpClient);
  readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly links = [
    { label: 'Dashboard', path: '/dashboard', icon: '▦' },
    { label: 'Catatan Keuangan', path: '/transactions', icon: '▣' },
    { label: 'Manajemen Stok', path: '/stocks', icon: '▤' },
    { label: 'Hutang & Pelanggan', path: '/debts', icon: '♟' },
    { label: 'Log Inventori', path: '/logs', icon: '☷' },
    { label: 'Kasir POS', path: '/pos', icon: '▥' },
  ];
  products: Product[] = [];
  logs: StockLog[] = [];
  transactions: Transaction[] = [];
  debts: Debt[] = [];
  categories: Category[] = [];
  cart: Product[] = [];
  search = '';
  loading = true;
  error = '';
  settingsOpen = false;
  checkingOut = false;
  checkoutError = '';

  ngOnInit(): void {
    this.activateFeature(this.route.snapshot.data['title'] as string);
    this.route.data.subscribe((data) => {
      const title = data['title'] as string;
      if (title === this.title) return;
      this.activateFeature(title);
    });
  }

  private activateFeature(title: string): void {
      this.title = title;
      this.products = [];
      this.logs = [];
      this.transactions = [];
      this.debts = [];
      this.cart = [];
      this.search = '';
      this.error = '';
      this.checkoutError = '';
      this.loading = true;

      if (this.title === 'Stok Produk') this.loadProducts();
      if (this.title === 'Log Aktivitas') this.loadLogs();
      if (this.title === 'Transaksi') this.loadTransactions();
      if (this.title === 'Utang Piutang') this.loadDebts();
      if (this.title === 'Point of Sale') { this.loadProducts(); this.loadCategories(); }
  }

  get filteredProducts(): Product[] {
    const query = this.search.toLowerCase().trim();
    return this.products.filter((product) => !query || product.name.toLowerCase().includes(query) || product.sku?.toLowerCase().includes(query));
  }

  get filteredLogs(): StockLog[] {
    const query = this.search.toLowerCase().trim();
    return this.logs.filter((log) => !query || log.product?.name.toLowerCase().includes(query) || log.product?.sku?.toLowerCase().includes(query));
  }

  get lowStock(): number { return this.products.filter((product) => product.stock <= product.min_stock).length; }
  get totalStockIn(): number { return this.logs.filter((log) => log.type === 'in').reduce((total, log) => total + log.quantity, 0); }
  get totalStockOut(): number { return this.logs.filter((log) => log.type === 'out').reduce((total, log) => total + log.quantity, 0); }
  get totalIncome(): number { return this.transactions.filter((item) => item.type === 'income').reduce((total, item) => total + Number(item.amount), 0); }
  get totalExpense(): number { return this.transactions.filter((item) => item.type === 'expense').reduce((total, item) => total + Number(item.amount), 0); }
  get totalDebt(): number { return this.debts.reduce((total, item) => total + Number(item.total_debt) - Number(item.paid_amount || 0), 0); }
  cartTotal(): number { return this.cart.reduce((total, product) => total + (product.price || 0), 0); }
  addToCart(product: Product): void {
    if (product.stock > 0) {
      product.stock -= 1;
      this.cart = [...this.cart, product];
    }
  }
  removeFromCart(index: number): void {
    const item = this.cart[index];
    if (item) item.stock += 1;
    this.cart = this.cart.filter((_, itemIndex) => itemIndex !== index);
  }

  checkout(): void {
    if (!this.cart.length || this.checkingOut) return;
    const category = this.categories.find((item) => item.type === 'income') || this.categories[0];
    if (!category) { this.checkoutError = 'Kategori transaksi belum tersedia.'; return; }

    this.checkingOut = true;
    this.checkoutError = '';
    const operator = this.auth.user()?.full_name || this.auth.user()?.email || 'kasir';
    const amount = this.cartTotal();
    const stockRequests = this.cart.map((item) => this.http.post(`${environment.apiUrl}/stock-logs`, {
      product_id: item.id,
      type: 'out',
      quantity: 1,
      operator,
      status: 'completed',
    }));

    forkJoin(stockRequests.length ? stockRequests : [of(null)]).pipe(
      switchMap(() => this.http.post(`${environment.apiUrl}/transactions`, {
        category_id: category.id,
        type: 'income',
        amount,
        description: 'Penjualan POS Kasir',
        source: 'pos',
      })),
    ).subscribe({
      next: () => {
        this.cart = [];
        this.checkingOut = false;
        this.checkoutError = '';
        this.loadProducts();
        this.cdr.markForCheck();
      },
      error: () => {
        this.checkingOut = false;
        this.checkoutError = 'Gagal memproses transaksi. Silakan coba lagi.';
        this.cdr.markForCheck();
      },
    });
  }
  openDetail(id: string): void {
    const path = this.title === 'Stok Produk' ? 'stocks' : this.title === 'Transaksi' ? 'transactions' : this.title === 'Utang Piutang' ? 'debts' : 'logs';
    this.router.navigate(['/', path, id]);
  }

  private loadProducts(): void {
    this.http.get<Product[]>(`${environment.apiUrl}/products`).pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); })).subscribe({
      next: (products) => { this.products = products; this.cdr.markForCheck(); },
      error: () => { this.error = 'Gagal memuat data produk.'; this.cdr.markForCheck(); },
    });
  }

  private loadLogs(): void {
    this.http.get<StockLog[]>(`${environment.apiUrl}/stock-logs`).pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); })).subscribe({
      next: (logs) => { this.logs = logs; this.cdr.markForCheck(); },
      error: () => { this.error = 'Gagal memuat data log inventori.'; this.cdr.markForCheck(); },
    });
  }

  private loadTransactions(): void {
    this.http.get<Transaction[]>(`${environment.apiUrl}/transactions`).pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); })).subscribe({
      next: (transactions) => { this.transactions = transactions; this.cdr.markForCheck(); },
      error: () => { this.error = 'Gagal memuat catatan keuangan.'; this.cdr.markForCheck(); },
    });
  }

  private loadCategories(): void {
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe({
      next: (categories) => { this.categories = categories; this.cdr.markForCheck(); },
      error: () => { this.cdr.markForCheck(); },
    });
  }

  private loadDebts(): void {
    this.http.get<Debt[]>(`${environment.apiUrl}/debts`).pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); })).subscribe({
      next: (debts) => { this.debts = debts; this.cdr.markForCheck(); },
      error: () => { this.error = 'Gagal memuat data hutang pelanggan.'; this.cdr.markForCheck(); },
    });
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.router.navigate(['/login']);
  }
}
