import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  CheckCircle2, 
  Settings,
  Package,
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/enrich', icon: Sparkles, label: 'Enrich' },
  { path: '/sessions', icon: ClipboardList, label: 'Sessions' },
  { path: '/verify', icon: CheckCircle2, label: 'Verify' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-primary-400" />
            <div>
              <h1 className="font-bold text-lg">Catalog</h1>
              <p className="text-xs text-gray-400">Enrichment Tool</p>
            </div>
          </div>
        </div>

        <nav className="mt-6">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-2 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
