import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './pages/auth/login.component';
import { RegisterComponent } from './pages/auth/register.component';
import { DashboardComponent } from './pages/dashboard.component';
import { FeatureComponent } from './pages/feature.component';

export const routes: Routes = [
	{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
	{ path: 'login', component: LoginComponent },
		{ path: 'register', component: RegisterComponent },
	{ path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
	{ path: 'new', component: FeatureComponent, canActivate: [authGuard], data: { title: 'Tambah Data' } },
	{ path: 'transactions', component: FeatureComponent, canActivate: [authGuard], data: { title: 'Transaksi' } },
	{ path: 'stocks', component: FeatureComponent, canActivate: [authGuard], data: { title: 'Stok Produk' } },
	{ path: 'pos', component: FeatureComponent, canActivate: [authGuard], data: { title: 'Point of Sale' } },
	{ path: 'debts', component: FeatureComponent, canActivate: [authGuard], data: { title: 'Utang Piutang' } },
	{ path: 'logs', component: FeatureComponent, canActivate: [authGuard], data: { title: 'Log Aktivitas' } },
	{ path: '**', redirectTo: 'dashboard' },
];
