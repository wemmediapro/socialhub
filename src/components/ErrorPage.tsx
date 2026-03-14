import React, { ReactNode } from "react";
import Link from "next/link";

export interface ErrorPageProps {
  code: number;
  title: string;
  message: string;
  action?: ReactNode;
}

export default function ErrorPage({ code, title, message, action }: ErrorPageProps) {
  const isServerError = code >= 500;
  return (
    <div className="error-page">
      <h1 className={`error-page-code ${isServerError ? "error-page-code--server" : ""}`}>{code}</h1>
      <h2 className="error-page-title">{title}</h2>
      <p className="error-page-message">{message}</p>
      {action ?? (
        <Link href="/" className="error-page-link">
          Retour à l&apos;accueil
        </Link>
      )}
    </div>
  );
}
