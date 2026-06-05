import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // noop
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-900">Cos poszlo nie tak</h2>
          <p className="mt-2 text-sm text-red-700">Odswiez strone i sprobuj ponownie.</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Odswiez strone
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
