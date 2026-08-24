import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../core/environment';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './detail.component.html',
})
export class DetailComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  readonly http = inject(HttpClient);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly type = this.route.snapshot.data['type'] as string;
  readonly title = this.route.snapshot.data['title'] as string;
  id = '';
  data: any = null;
  categories: { id: number; name: string }[] = [];
  loading = true;
  saving = false;
  error = '';
  editing = false;

  ngOnInit(): void {
    this.activateId(this.route.snapshot.paramMap.get('id') || '');
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id') || '';
      if (id === this.id) return;
      this.activateId(id);
    });
    if (this.type === 'transaction') this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/categories`).subscribe({ next: (data) => { this.categories = data; this.cdr.markForCheck(); } });
  }

  private activateId(id: string): void {
      this.id = id;
      this.data = null;
      this.error = '';
      this.loadDetail();
  }

  get endpoint(): string { return `${environment.apiUrl}/${this.type === 'product' ? 'products' : this.type === 'transaction' ? 'transactions' : this.type === 'debt' ? 'debts' : 'stock-logs'}/${this.id}`; }
  get backPath(): string { return this.type === 'product' ? '/stocks' : this.type === 'transaction' ? '/transactions' : this.type === 'debt' ? '/debts' : '/logs'; }

  loadDetail(): void {
    this.loading = true;
    this.http.get(this.endpoint).pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); })).subscribe({
      next: (data) => { this.data = data; this.cdr.markForCheck(); },
      error: (response) => { this.error = response?.error?.error || 'Data tidak ditemukan.'; this.cdr.markForCheck(); }
    });
  }

  save(): void {
    this.saving = true;
    const payload = this.type === 'product'
      ? { name: this.data.name, sku: this.data.sku, unit: this.data.unit, price: Number(this.data.price), min_stock: Number(this.data.min_stock) }
      : this.type === 'transaction'
        ? { category_id: Number(this.data.category_id), type: this.data.type, amount: Number(this.data.amount), description: this.data.description, transaction_date: this.data.transaction_date, source: this.data.source, items: this.data.items || [] }
        : this.type === 'debt'
          ? { customer_name: this.data.customer_name, total_debt: Number(this.data.total_debt), due_date: this.data.due_date, status: this.data.status, note: this.data.note }
          : { status: this.data.status, note: this.data.note };
    this.http.put(this.endpoint, payload).subscribe({
      next: (data) => { this.data = data; this.editing = false; this.saving = false; this.cdr.markForCheck(); },
      error: (response) => { this.error = response?.error?.error || 'Gagal menyimpan perubahan.'; this.saving = false; this.cdr.markForCheck(); }
    });
  }

  remove(): void {
    if (!confirm(`Hapus ${this.title.toLowerCase()} ini?`)) return;
    this.http.delete(this.endpoint).subscribe({
      next: () => { this.router.navigate([this.backPath]); },
      error: (response) => { this.error = response?.error?.error || 'Gagal menghapus data.'; this.cdr.markForCheck(); }
    });
  }
}
