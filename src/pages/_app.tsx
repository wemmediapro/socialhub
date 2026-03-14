import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ModernLayout from '@/components/ModernLayout';
import { AuthProvider } from '@/contexts/AuthContext';
import { TranslationProvider } from '@/i18n/TranslationContext';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Page d'erreur : afficher sans layout pour éviter cascade (500 sur _error.js)
  const isErrorPage = Component.displayName === 'Error' || (pageProps as any).statusCode != null;

  // Pages sans layout (login, register)
  const noLayoutPages = ['/login', '/register'];
  const shouldShowLayout = !noLayoutPages.includes(router.pathname) && !isErrorPage;

  if (isErrorPage) {
    return <Component {...pageProps} />;
  }

  const page = shouldShowLayout ? (
    <ModernLayout>
      <Component {...pageProps} />
    </ModernLayout>
  ) : (
    <Component {...pageProps} />
  );

  return (
    <ErrorBoundary>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
      </Head>
      <TranslationProvider>
        <AuthProvider>
          {page}
        </AuthProvider>
      </TranslationProvider>
    </ErrorBoundary>
  );
}
