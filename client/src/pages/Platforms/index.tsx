import { useEffect, useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, XCircle, Plug, Unplug, FlaskConical, Loader2,
  ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
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
  const [showSetupGuide, setShowSetupGuide] = useState(false);

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
        toast('Błąd połączenia Allegro. Sprawdź konfigurację ALLEGRO_CLIENT_ID/SECRET.', 'error');
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient, toast]);

  const disconnectMut = useMutation({
    mutationFn: () => disconnectPlatform('ALLEGRO'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      toast('Allegro rozłączone', 'success');
    },
    onError: () => toast('Nie udało się rozłączyć Allegro', 'error'),
  });

  const testMut = useMutation({
    mutationFn: () => testPlatform('ALLEGRO'),
    onSuccess: (r) => toast(r.message, 'success'),
    onError: () => toast('Test połączenia nie powiódł się — sprawdź token lub skonfiguruj ALLEGRO_CLIENT_ID/SECRET', 'error'),
  });

  async function startAllegroOAuth() {
    const popup = openOAuthPopup();
    try {
      const { authorizationUrl } = await getAllegroOAuthStart();
      if (popup) popup.location.href = authorizationUrl;
      else window.location.href = authorizationUrl;
    } catch (error) {
      popup?.close();
      const msg = getRequestErrorMessage(error, 'Nie udało się uruchomić OAuth — sprawdź ALLEGRO_CLIENT_ID i ALLEGRO_CLIENT_SECRET w server/.env');
      toast(msg, 'error');
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-ink">Konto Allegro</h1>
        <p className="text-sm text-ink-muted mt-1">
          Połącz konto sprzedawcy Allegro OAuth, aby wystawiać ogłoszenia.
        </p>
      </div>

      {/* Status kafelka */}
      <div className="flex flex-col items-center rounded-2xl border border-warm-200 bg-white p-6 shadow-sm gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500 text-white font-bold text-xl select-none">
          AL
        </div>

        <div className="text-center">
          <p className="font-semibold text-ink text-lg">Allegro</p>
          <span className={`inline-flex items-center gap-1 text-sm font-medium mt-1 ${active ? 'text-green-600' : 'text-ink-faint'}`}>
            {active ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {active ? 'Połączone' : 'Niepołączone'}
          </span>
        </div>

        <div className="flex flex-col gap-2 w-full">
          {active ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => testMut.mutate()}
                disabled={testMut.isPending}
              >
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
              onClick={() => setIsOAuthModalOpen(true)}
            >
              <Plug className="h-4 w-4 mr-2" />
              Połącz Allegro przez OAuth
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-ink-faint">
        Tokeny dostępowe są szyfrowane AES-256 i przechowywane wyłącznie po stronie serwera.
      </p>

      {/* Setup guide */}
      <div className="rounded-xl border border-amber-200 bg-amber-50">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-amber-900"
          onClick={() => setShowSetupGuide((v) => !v)}
        >
          <span>Jak skonfigurować prawdziwe konto Allegro?</span>
          {showSetupGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showSetupGuide && (
          <div className="border-t border-amber-200 px-4 pb-4 text-sm text-amber-900 space-y-3">
            <ol className="list-decimal list-inside space-y-2 pt-3">
              <li>
                Zaloguj się do{' '}
                <a
                  href="https://apps.developer.allegro.pl"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline inline-flex items-center gap-1"
                >
                  apps.developer.allegro.pl <ExternalLink className="h-3 w-3" />
                </a>{' '}
                i utwórz nową aplikację (typ: <em>Web application</em>).
              </li>
              <li>
                Ustaw <strong>Redirect URI</strong> na:{' '}
                <code className="rounded bg-amber-100 px-1">
                  http://localhost:3001/api/platforms/allegro/oauth/callback
                </code>
              </li>
              <li>
                Skopiuj <strong>Client ID</strong> i <strong>Client Secret</strong>.
              </li>
              <li>
                W pliku <code className="rounded bg-amber-100 px-1">server/.env</code> ustaw:
                <pre className="mt-1 rounded bg-amber-100 p-2 text-xs font-mono">
{`ALLEGRO_CLIENT_ID=<twój client id>
ALLEGRO_CLIENT_SECRET=<twój client secret>
ALLEGRO_MOCK=false
ALLEGRO_SANDBOX=false`}
                </pre>
              </li>
              <li>Zrestartuj serwer i kliknij <strong>Połącz Allegro przez OAuth</strong>.</li>
            </ol>
            <p className="text-xs text-amber-700 pt-1">
              Sandbox (allegro.pl.allegrosandbox.pl) działa tak samo — ustaw{' '}
              <code className="rounded bg-amber-100 px-1">ALLEGRO_SANDBOX=true</code> i użyj konta testowego.
            </p>
          </div>
        )}
      </div>

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
