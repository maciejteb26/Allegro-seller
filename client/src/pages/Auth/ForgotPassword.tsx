import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { forgotPassword } from '@/api/auth.api';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email('Nieprawidłowy email'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await forgotPassword(data.email);
      setSubmitted(true);
    } catch {
      toast('Nie udało się wysłać linku. Spróbuj ponownie.', 'error');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-sm border border-gray-200">
        <div className="text-center">
          <Link to="/" className="font-display text-2xl font-bold text-gray-900 hover:text-primary-600">
            szybkiewystawianie.pl
          </Link>
          <p className="mt-2 text-sm text-gray-600">Resetowanie hasła</p>
        </div>

        {submitted ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-600">
              Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetu hasła.
              Sprawdź skrzynkę (również folder spam).
            </p>
            <Link to="/login" className="inline-block text-sm font-medium text-primary-600 hover:underline">
              Wróć do logowania
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-gray-600">
              Podaj email powiązany z kontem. Wyślemy link do ustawienia nowego hasła.
            </p>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="jan@przykład.pl" {...register('email')} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Wysyłanie...' : 'Wyślij link resetujący'}
            </Button>
          </form>
        )}

        {!submitted && (
          <p className="text-center text-sm text-gray-600">
            <Link to="/login" className="font-medium text-primary-600 hover:underline">
              Wróć do logowania
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
