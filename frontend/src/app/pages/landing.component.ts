import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

interface LandingFeature {
  title: string;
  text: string;
  icon: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  constructor(private readonly router: Router) {}

  readonly features: LandingFeature[] = [
    {
      title: 'Dasbor Utama',
      text: 'Pantau kesehatan bisnis, tren pendapatan, dan metrik operasional harian dalam satu tampilan.',
      icon: 'dashboard',
    },
    {
      title: 'Stok Barang',
      text: 'Dapatkan peringatan stok rendah dan kelola inventaris secara real-time tanpa tebakan.',
      icon: 'stock',
    },
    {
      title: 'Kasir POS',
      text: 'Proses transaksi lebih cepat dan akurat lewat Terminal Kasir yang terhubung langsung ke stok.',
      icon: 'pos',
    },
    {
      title: 'Pantau Hutang',
      text: 'Jaga arus kas tetap sehat dengan pelacakan piutang dan hutang pelanggan yang belum lunas.',
      icon: 'debt',
    },
    {
      title: 'Log Aktivitas',
      text: 'Lacak barang masuk dan keluar dengan riwayat yang siap membantu audit.',
      icon: 'log',
    },
  ];

  scrollToSection(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }
}
