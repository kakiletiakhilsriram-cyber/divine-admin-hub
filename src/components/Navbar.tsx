import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Sevas', path: '/sevas' },
  { label: 'Events', path: '/events' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Contact', path: '/contact' },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/images/logo.png" alt="Sri Ramalayam Logo" className="w-10 h-10" />
          <div>
            <span className="font-display font-semibold text-foreground text-base tracking-tight">
              Ramalayam<span className="text-muted-foreground">(రామాలయం)</span>
            </span>
            <span className="block text-[10px] text-muted-foreground leading-none">
              Yenugupalli Village(konaseema)
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className="ml-2 px-4 py-2 rounded-md text-sm font-medium temple-gradient text-primary-foreground shadow-sm hover:shadow-md transition-shadow active:scale-[0.97]"
            >
              Dashboard
            </Link>
          )}
          {!user && (
            <Link
              to="/login"
              className="ml-2 px-4 py-2 rounded-md text-sm font-medium border border-primary text-primary hover:bg-primary/5 transition-colors"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-card border-t border-border" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-primary">
                Dashboard
              </Link>
            )}
            {!user && (
              <Link to="/login" onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-primary">
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
