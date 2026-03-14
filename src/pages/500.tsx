import React from "react";
import ErrorPage from "@/components/ErrorPage";

export default function Custom500() {
  return (
    <ErrorPage
      code={500}
      title="Erreur serveur"
      message="Une erreur interne s'est produite. Notre équipe a été notifiée."
    />
  );
}
