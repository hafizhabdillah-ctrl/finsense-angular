import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { environment } from '../core/environment';
import { AuthService } from '../core/auth.service';
import { SettingsComponent } from '../components/settings.component';

interface ProductOption { id: string; name: string; sku?: string; stock: number; price?: number; }
interface CategoryOption { id: number; name: string; type: string; }

type ItemType = 'product' | 'transaction' | 'pos' | 'debt' | 'log';

@Component({
  selector: 'app-new-item',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, SettingsComponent],
  templateUrl: './new-item.component.html',
})
export class NewItemComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  readonly http = inject(HttpClient);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  readonly links = [
    { label: 'Dashboard', path: '/dashboard', icon: '▦' },
    { label: 'Catatan Keuangan', path: '/transactions', icon: '▣' },
    { label: 'Manajemen Stok', path: '/stocks', icon: '▤' },
    { label: 'POS Terminal', path: '/pos', icon: '▥' },
    { label: 'Hutang & Pelanggan', path: '/debts', icon: '♟' },
    { label: 'Log Inventori', path: '/logs', icon: '☷' },
  ];
  readonly tabs: { key: ItemType; label: string }[] = [
    { key: 'product', label: 'Produk' },
    { key: 'transaction', label: 'Transaksi' },
    { key: 'pos', label: 'POS' },
    { key: 'debt', label: 'Hutang' },
    { key: 'log', label: 'Log Stok' },
  ];

  type: ItemType = 'product';
  submitting = false;
  loadingOptions = true;
  settingsOpen = false;
  error = '';
  products: ProductOption[] = [];
  categories: CategoryOption[] = [];
  product = { name: '', sku: '', stock: 0, unit: 'pcs', price: 0, min_stock: 10 };
  transaction = { category_id: '', type: 'income', amount: 0, description: '', transaction_date: this.toDateInput(new Date()) };
  pos = { product_id: '', quantity: 1 };
  debt = { customer_name: '', total_debt: 0, due_date: this.toDateInput(new Date(Date.now() + 86400000)), note: '' };
  log = { product_id: '', type: 'in', quantity: 1, note: '', operator: 'Admin', status: 'completed' };

  ngOnInit(): void {
    const requestedType = this.route.snapshot.queryParamMap.get('type') as ItemType | null;
    if (requestedType && this.tabs.some((tab) => tab.key === requestedType)) this.type = requestedType;

    forkJoin({
      products: this.http.get<ProductOption[]>(`${environment.apiUrl}/products`),
      categories: this.http.get<CategoryOption[]>(`${environment.apiUrl}/categories`),
    }).pipe(finalize(() => { this.loadingOptions = false; this.cdr.markForCheck(); })).subscribe({
      next: ({ products, categories }) => { this.products = products; this.categories = categories; this.cdr.markForCheck(); },
      error: () => { this.cdr.markForCheck(); },
    });
  }

  get heading(): string {
    return { product: 'Tambah Barang', transaction: 'Tambah Transaksi', pos: 'Tambah Transaksi POS', debt: 'Tambah Hutang', log: 'Tambah Log Barang' }[this.type];
  }

  selectTab(type: ItemType): void {
    this.type = type;
    this.error = '';
  }

  async submit(): Promise<void> {
    this.submitting = true;
    this.error = '';

    if (this.type === 'pos') {
      this.submitPos();
      return;
    }

    const request = this.type === 'product'
      ? this.http.post(`${environment.apiUrl}/products`, this.product)
      : this.type === 'transaction'
        ? this.http.post(`${environment.apiUrl}/transactions`, { ...this.transaction, category_id: Number(this.transaction.category_id), amount: Number(this.transaction.amount), items: [] })
        : this.type === 'debt'
          ? this.http.post(`${environment.apiUrl}/debts`, { ...this.debt, total_debt: Number(this.debt.total_debt), due_date: new Date(this.debt.due_date).toISOString() })
          : this.http.post(`${environment.apiUrl}/stock-logs`, { ...this.log, quantity: Number(this.log.quantity) });
    request.subscribe({
      next: () => this.router.navigate([this.destination]),
      error: (response) => this.handleError(response),
    });
  }

  private submitPos(): void {
    const chosenProduct = this.products.find((product) => product.id === this.pos.product_id);
    if (!chosenProduct) {
      this.error = 'Pilih produk terlebih dahulu.';
      this.submitting = false;
      this.cdr.markForCheck();
      return;
    }
    const quantity = Number(this.pos.quantity) || 1;
    const category = this.categories.find((item) => item.type === 'income') || this.categories[0];

    this.http.post(`${environment.apiUrl}/stock-logs`, { product_id: this.pos.product_id, type: 'out', quantity, operator: this.auth.user()?.full_name || 'Kasir', status: 'completed' }).subscribe({
      next: () => {
        this.http.post(`${environment.apiUrl}/transactions`, {
          category_id: category?.id,
          type: 'income',
          amount: (chosenProduct.price || 0) * quantity,
          description: `Penjualan POS: ${chosenProduct.name} x${quantity}`,
          source: 'pos',
        }).subscribe({
          next: () => this.router.navigate(['/pos']),
          error: (response) => this.handleError(response),
        });
      },
      error: (response) => this.handleError(response),
    });
  }

  private handleError(response: any): void {
    this.error = response?.status === 409
      ? 'SKU sudah digunakan. Silakan gunakan SKU yang berbeda.'
      : response?.error?.error || response?.error?.message || 'Data gagal disimpan.';
    this.submitting = false;
    this.cdr.markForCheck();
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.router.navigate(['/login']);
  }

  get destination(): string {
    return this.type === 'product' ? '/stocks' : this.type === 'transaction' ? '/transactions' : this.type === 'debt' ? '/debts' : '/logs';
  }

  private toDateInput(date: Date): string { return date.toISOString().slice(0, 10); }
}
