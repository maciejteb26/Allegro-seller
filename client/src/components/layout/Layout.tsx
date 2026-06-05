import { Outlet } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 md:hidden" />
          <Dialog.Content className="fixed left-0 top-0 z-50 h-full md:hidden">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
