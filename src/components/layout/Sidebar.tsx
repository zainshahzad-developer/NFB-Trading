import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  FileText,
  BarChart3,
  Settings,
  Bot,
  Users,
  Store,
  Sparkles,
  ArrowLeftRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import nfbLogo from '@/assets/nfb-logo.png';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Stock', href: '/stock', icon: Package },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Purchase Bills', href: '/purchase-bills', icon: FileText },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Sellers', href: '/sellers', icon: Store },
  { name: 'Currency', href: '/currency', icon: ArrowLeftRight },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border shadow-sm">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center justify-center px-4 border-b border-border bg-background">
          <img
            src={nfbLogo}
            alt="NFB Trading LTD"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-3 py-6">
          <p className="px-4 mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'sidebar-link group',
                  isActive && 'active'
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                )} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* AI Assistant Badge */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary/10 to-warning/10 p-4 border border-primary/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary pulse-dot">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AI Assistant</p>
              <p className="text-xs text-muted-foreground">Ready to help</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}