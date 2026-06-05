import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '@/api/auth.api';
import { getMe } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email('Nieprawidłowy email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
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
      await login(data);
      const user = await getMe();
      setUser(user);
      navigate('/dashboard');
    } catch {
      toast('Nieprawidłowy email lub hasło', 'error');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-sm border border-gray-200">
        <div className="text-center">
          <Link to="/" className="font-display text-2xl font-bold text-gray-900 hover:text-primary-600">
            Allegro Seller
          </Link>
          <p className="mt-2 text-sm text-gray-600">Zaloguj się do swojego konta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="jan@przykład.pl" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Hasło</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Nie masz konta?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:underline">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
}
