import {
  CirclePlus,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  Store,
  Users,
} from 'lucide-angular';

/** Icons used by the shared sidebar/topbar shell (dashboard, feature, new-item pages).
 * Registered globally via `LucideAngularModule.pick(NAV_ICONS)` in app.config.ts. */
export const NAV_ICONS = {
  CirclePlus,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  Store,
  Users,
};

export const NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'layout-dashboard' },
  { label: 'Catatan Keuangan', path: '/transactions', icon: 'receipt' },
  { label: 'Manajemen Stok', path: '/stocks', icon: 'package' },
  { label: 'POS Terminal', path: '/pos', icon: 'store' },
  { label: 'Hutang & Pelanggan', path: '/debts', icon: 'users' },
  { label: 'Log Inventori', path: '/logs', icon: 'history' },
] as const;
