import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '@/api/auth.api';
import { getMe } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  name: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
  email: z.string().email('Nieprawidłowy email'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await registerApi(data);
      const user = await getMe();
      setUser(user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast(msg ?? 'Błąd rejestracji', 'error');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-sm border border-gray-200">
        <div className="text-center">
          <Link to="/" className="font-display text-2xl font-bold text-gray-900 hover:text-primary-600">
            Allegro Seller
          </Link>
          <p className="mt-2 text-sm text-gray-600">Utwórz nowe konto</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Imię i nazwisko</Label>
            <Input id="name" placeholder="Jan Kowalski" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="jan@przykład.pl" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Hasło</Label>
            <Input id="password" type="password" placeholder="Minimum 8 znaków" {...register('password')} />
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Rejestracja...' : 'Zarejestruj się'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Masz już konto?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
