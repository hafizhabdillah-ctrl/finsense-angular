import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../core/environment';

interface ProductOption { id: string; name: string; sku?: string; }
interface CategoryOption { id: number; name: string; type: string; }

type ItemType = 'product' | 'transaction' | 'debt' | 'log';

@Component({
  selector: 'app-new-item',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './new-item.component.html',
})
export class NewItemComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  readonly http = inject(HttpClient);
  readonly router = inject(Router);
  type: ItemType = 'product';
  submitting = false;
  loadingOptions = true;
  error = '';
  products: ProductOption[] = [];
  categories: CategoryOption[] = [];
  product = { name: '', sku: '', stock: 0, unit: 'pcs', price: 0, min_stock: 10 };
  transaction = { category_id: '', type: 'income', amount: 0, description: '', transaction_date: this.toDateInput(new Date()) };
  debt = { customer_name: '', total_debt: 0, due_date: this.toDateInput(new Date(Date.now() + 86400000)), note: '' };
  log = { product_id: '', type: 'in', quantity: 1, note: '', operator: 'Admin', status: 'completed' };

  constructor() {
    this.http.get<ProductOption[]>(`${environment.apiUrl}/products`).subscribe({
      next: (data) => { this.products = data; this.cdr.markForCheck(); },
      complete: () => { this.loadingOptions = false; this.cdr.markForCheck(); },
      error: () => { this.loadingOptions = false; this.cdr.markForCheck(); }
    });
    this.http.get<CategoryOption[]>(`${environment.apiUrl}/categories`).subscribe({
      next: (data) => { this.categories = data; this.cdr.markForCheck(); }
    });
  }

  get heading(): string {
    return { product: 'Tambah Barang', transaction: 'Tambah Transaksi', debt: 'Tambah Hutang', log: 'Tambah Log Barang' }[this.type];
  }

  async submit(): Promise<void> {
    this.submitting = true;
    this.error = '';
    const request = this.type === 'product'
      ? this.http.post(`${environment.apiUrl}/products`, this.product)
      : this.type === 'transaction'
        ? this.http.post(`${environment.apiUrl}/transactions`, { ...this.transaction, category_id: Number(this.transaction.category_id), amount: Number(this.transaction.amount), items: [] })
        : this.type === 'debt'
          ? this.http.post(`${environment.apiUrl}/debts`, { ...this.debt, total_debt: Number(this.debt.total_debt), due_date: new Date(this.debt.due_date).toISOString() })
          : this.http.post(`${environment.apiUrl}/stock-logs`, { ...this.log, quantity: Number(this.log.quantity) });
    request.subscribe({
      next: () => this.router.navigate([this.destination]),
      error: (response) => {
        this.error = response?.status === 409
          ? 'SKU sudah digunakan. Silakan gunakan SKU yang berbeda.'
          : response?.error?.error || response?.error?.message || 'Data gagal disimpan.';
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  get destination(): string { return this.type === 'product' ? '/stocks' : this.type === 'transaction' ? '/transactions' : this.type === 'debt' ? '/debts' : '/logs'; }
  private toDateInput(date: Date): string { return date.toISOString().slice(0, 10); }
}
