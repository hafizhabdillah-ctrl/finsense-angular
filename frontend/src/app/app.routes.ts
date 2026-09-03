import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './pages/auth/login.component';
import { RegisterComponent } from './pages/auth/register.component';
import { DashboardComponent } from './pages/dashboard.component';
import { FeatureComponent } from './pages/feature.component';
import { NewItemComponent } from './pages/new-item.component';
import { DetailComponent } from './pages/detail.component';

export const routes: Routes = [
	{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
	{ path: 'login', component: LoginComponent },
		{ path: 'register', component: RegisterComponent },
	{ path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
	{ path: 'new', component: NewItemComponent, canActivate: [authGuard] },
	{ path: 'transactions', component: FeatureComponent, canActivate: [authGuard], data: { title: 'Transaksi' } },
	{ path: 'transactions/:id', component: DetailComponent, canActivate: [authGuard], data: { type: 'transaction', title: 'Detail Transaksi' } },
	{ path: 'stocks', component: FeatureComponent, canActivate: [authGuard], data: { title: 'Stok Produk' } },
	{ path: 'stocks/:id', component: DetailComponent, canActivate: [authGuard], data: { type: 'product', title: 'Detail Produk' } },
	{ path: 'pos', component: FeatureComponent, canActivate: [authGuard], data: { title: 'Point of Sale' } },
	{ path: 'debts', component: FeatureComponent, canActivate: [authGuard], data: { title: 'Utang Piutang' } },
	{ path: 'debts/:id', component: DetailComponent, canActivate: [authGuard], data: { type: 'debt', title: 'Detail Hutang' } },
	{ path: 'logs', component: FeatureComponent, canActivate: [authGuard], data: { title: 'Log Aktivitas' } },
	{ path: 'logs/:id', component: DetailComponent, canActivate: [authGuard], data: { type: 'log', title: 'Detail Log' } },
	{ path: '**', redirectTo: 'dashboard' },
];
