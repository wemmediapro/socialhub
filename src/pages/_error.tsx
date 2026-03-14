import React from 'react';
import { NextPageContext } from 'next';
import Link from 'next/link';

interface ErrorProps {
  statusCode?: number;
}

function ErrorPage({ statusCode = 500 }: ErrorProps) {
  const errorMessage = statusCode === 404
    ? "La page que vous recherchez n'existe pas."
    : `Une erreur ${statusCode} s'est produite sur le serveur`;
  
  const helpMessage = statusCode === 404
    ? "Vérifiez l'URL ou retournez à l'accueil."
    : 'Veuillez réessayer plus tard ou contacter le support.';

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '72px', margin: '0', color: statusCode === 500 ? '#d32f2f' : '#333' }}>
        {statusCode}
      </h1>
      <h2 style={{ fontSize: '24px', margin: '20px 0', color: '#666' }}>
        {errorMessage}
      </h2>
      <p style={{ fontSize: '16px', color: '#999', marginBottom: '30px' }}>
        {helpMessage}
      </p>
      <Link 
        href="/" 
        style={{ 
          padding: '12px 24px', 
          backgroundColor: '#0070f3', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '16px'
        }}
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}

ErrorPage.getInitialProps = (ctx: NextPageContext) => {
  const { res, err } = ctx;
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
