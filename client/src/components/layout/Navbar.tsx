import { useAuthStore } from '@/store/auth.store';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenMobileMenu}>
        <Menu className="h-5 w-5" />
      </Button>
      {user && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </header>
  );
}
