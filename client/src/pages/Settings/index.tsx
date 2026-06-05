import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth.store';
import { changePassword } from '@/api/settings.api';
import MarginsSection from './Margins';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [formError, setFormError] = useState('');

  const passwordMut = useMutation({
    mutationFn: () => changePassword(form.currentPassword, form.newPassword),
    onSuccess: () => {
      toast('Hasło zostało zmienione', 'success');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFormError('');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setFormError(msg ?? 'Wystąpił błąd podczas zmiany hasła');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword.length < 8) {
      setFormError('Nowe hasło musi mieć co najmniej 8 znaków');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setFormError('Nowe hasła nie są identyczne');
      return;
    }
    setFormError('');
    passwordMut.mutate();
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-gray-900">Ustawienia</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Konto</h2>
        <div className="grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium text-gray-600">Adres e-mail</span>
            </div>
            <p className="font-semibold text-gray-900">{user?.email ?? '—'}</p>
            <p className="text-xs text-gray-400">Zmiana e-maila niedostępna w tej wersji</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium text-gray-600">Zmiana hasła</span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Aktualne hasło"
                  value={form.currentPassword}
                  onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  className="pr-9 text-sm"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowCurrent((v) => !v)}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  placeholder="Nowe hasło (min. 8 znaków)"
                  value={form.newPassword}
                  onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                  className="pr-9 text-sm"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNew((v) => !v)}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Input
                type="password"
                placeholder="Potwierdź nowe hasło"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className="text-sm"
              />
              {formError && <p className="text-xs text-red-500">{formError}</p>}
              <Button type="submit" size="sm" className="w-full" disabled={passwordMut.isPending}>
                {passwordMut.isPending ? 'Zapisywanie...' : 'Zmień hasło'}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Marże na platformach</h2>
        <p className="text-sm text-gray-500">Marże są automatycznie zapisywane po zmianie wartości.</p>
        <MarginsSection />
      </section>
    </div>
  );
}
