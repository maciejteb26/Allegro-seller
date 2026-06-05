import { useEffect, useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Plug, Unplug, FlaskConical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  connectPlatform,
  disconnectPlatform,
  getAllegroOAuthStart,
  getPlatforms,
  testPlatform,
} from '@/api/platforms.api';
import { useToast } from '@/components/ui/toast';
import { OAuthConnectModal } from '@/components/platforms/OAuthConnectModal';

function openOAuthPopup(): Window | null {
  const w = 600, h = 700;
  const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
  const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
  return window.open('about:blank', 'oauth_popup', `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);
}

export default function PlatformsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data = [] } = useQuery({ queryKey: ['platforms'], queryFn: getPlatforms });
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
  const [isOAuthConnecting, setIsOAuthConnecting] = useState(false);

  const allegro = data.find((item) => item.platform === 'ALLEGRO');
  const active = !!allegro?.isActive;

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const d = e.data;
      if (d?.type !== 'OAUTH_CONNECTED') return;
      if (d.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['platforms'] });
        toast('Allegro połączone pomyślnie!', 'success');
      } else {
        toast('Błąd połączenia Allegro', 'error');
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient, toast]);

  const connectMut = useMutation({
    mutationFn: () => connectPlatform('ALLEGRO'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platforms'] }),
    onError: () => toast('Nie udało się połączyć Allegro', 'error'),
  });
  const disconnectMut = useMutation({
    mutationFn: () => disconnectPlatform('ALLEGRO'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platforms'] }),
    onError: () => toast('Nie udało się rozłączyć Allegro', 'error'),
  });
  const testMut = useMutation({
    mutationFn: () => testPlatform('ALLEGRO'),
    onSuccess: (r) => toast(r.message, 'success'),
    onError: () => toast('Test połączenia nie powiódł się', 'error'),
  });

  async function startAllegroOAuth() {
    const popup = openOAuthPopup();
    try {
      const { authorizationUrl } = await getAllegroOAuthStart();
      if (popup) popup.location.href = authorizationUrl;
      else window.location.href = authorizationUrl;
    } catch (error) {
      popup?.close();
      toast(getRequestErrorMessage(error, 'Nie udało się uruchomić OAuth Allegro'), 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Konto Allegro</h1>
        <p className="text-sm text-gray-500 mt-1">Połącz konto sprzedawcy Allegro, aby wystawiać ogłoszenia</p>
      </div>

      <div className="max-w-sm">
        <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500 text-white font-bold text-xl select-none">
            AL
          </div>

          <div className="text-center">
            <p className="font-semibold text-gray-900 text-lg">Allegro</p>
            <span className={`inline-flex items-center gap-1 text-sm font-medium mt-1 ${active ? 'text-green-600' : 'text-gray-400'}`}>
              {active ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {active ? 'Połączone' : 'Niepołączone'}
            </span>
          </div>

          <div className="flex flex-col gap-2 w-full">
            {active ? (
              <>
                <Button size="sm" variant="outline" className="w-full" onClick={() => testMut.mutate()} disabled={testMut.isPending}>
                  {testMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FlaskConical className="h-4 w-4 mr-2" />}
                  {testMut.isPending ? 'Testuję...' : 'Test połączenia'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => disconnectMut.mutate()}
                  disabled={disconnectMut.isPending}
                >
                  <Unplug className="h-4 w-4 mr-2" />
                  Rozłącz
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="w-full"
                onClick={async () => {
                  try {
                    await connectMut.mutateAsync();
                    toast('Allegro połączone pomyślnie!', 'success');
                  } catch (error) {
                    if (axios.isAxiosError(error) && error.response?.status === 400) {
                      setIsOAuthModalOpen(true);
                      return;
                    }
                  }
                }}
                disabled={connectMut.isPending}
              >
                <Plug className="h-4 w-4 mr-2" />
                Połącz Allegro
              </Button>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Tokeny dostępowe są szyfrowane AES-256 i przechowywane wyłącznie po stronie serwera.
      </p>

      <OAuthConnectModal
        open={isOAuthModalOpen}
        isSubmitting={isOAuthConnecting}
        onClose={() => {
          if (isOAuthConnecting) return;
          setIsOAuthModalOpen(false);
        }}
        onContinue={async () => {
          setIsOAuthConnecting(true);
          try {
            await startAllegroOAuth();
          } finally {
            setIsOAuthConnecting(false);
            setIsOAuthModalOpen(false);
          }
        }}
      />
    </div>
  );
}

function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { error?: string } | undefined)?.error;
    if (backendMessage) return backendMessage;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
