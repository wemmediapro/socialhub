import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          padding: 'var(--spacing-8)',
          maxWidth: 560,
          margin: '0 auto',
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
        }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--spacing-2)', color: 'var(--color-text-primary)' }}>
            Une erreur s&apos;est produite
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-4)' }}>
            Rechargez la page ou revenez au tableau de bord.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: 'var(--spacing-2) var(--spacing-4)',
              background: 'var(--color-primary)',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Retour à l&apos;accueil
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}
