import React from "react";
import ErrorPage from "@/components/ErrorPage";

export default function Custom404() {
  return (
    <ErrorPage
      code={404}
      title="Page non trouvée"
      message="La page que vous recherchez n'existe pas ou a été déplacée."
    />
  );
}
