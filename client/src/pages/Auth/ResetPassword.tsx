import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@/api/auth.api';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z
  .object({
    password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
    confirmPassword: z.string().min(1, 'Potwierdź hasło'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła muszą być identyczne',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    if (!token) {
      toast('Brak tokenu resetu. Poproś o nowy link.', 'error');
      return;
    }

    try {
      await resetPassword(token, data.password);
      toast('Hasło zostało zmienione. Zaloguj się nowym hasłem.', 'success');
      navigate('/login');
    } catch {
      toast('Link jest nieprawidłowy lub wygasł. Poproś o nowy.', 'error');
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-600">Link do resetu hasła jest nieprawidłowy lub wygasł.</p>
          <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:underline">
            Poproś o nowy link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-sm border border-gray-200">
        <div className="text-center">
          <Link to="/" className="font-display text-2xl font-bold text-gray-900 hover:text-primary-600">
            szybkiewystawianie.pl
          </Link>
          <p className="mt-2 text-sm text-gray-600">Ustaw nowe hasło</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="password">Nowe hasło</Label>
            <Input id="password" type="password" placeholder="Minimum 8 znaków" {...register('password')} />
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Powtórz hasło"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Zapisywanie...' : 'Ustaw nowe hasło'}
          </Button>
        </form>
      </div>
    </div>
  );
}
