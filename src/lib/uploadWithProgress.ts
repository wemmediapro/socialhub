/**
 * Upload un fichier vers /api/upload/local avec suivi de progression (XHR).
 * Utilisé pour afficher une barre de progression sur les uploads vidéo/fichiers.
 */
export function uploadFileWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    const xhr = new XMLHttpRequest();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      } else {
        onProgress(0);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          if (result.success && result.url) {
            resolve(`${origin}${result.url}`);
          } else {
            reject(new Error(result.error || "Upload failed"));
          }
        } catch {
          reject(new Error("Invalid response"));
        }
        return;
      }
      // 413 = limite taille côté serveur (souvent Nginx)
      if (xhr.status === 413) {
        reject(new Error(
          "Fichier trop volumineux. Sur le VPS, augmentez la limite dans Nginx : client_max_body_size 200M; puis reload nginx."
        ));
        return;
      }
      // Réponse d'erreur peut être HTML (page d'erreur) et non JSON
      const text = xhr.responseText || "";
      if (text.trimStart().startsWith("<")) {
        reject(new Error(`Erreur serveur (${xhr.status}). Vérifiez la config Nginx et les logs.`));
        return;
      }
      try {
        const err = JSON.parse(text);
        reject(new Error(err.error || `HTTP ${xhr.status}`));
      } catch {
        reject(new Error(`Erreur ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.open("POST", "/api/upload/local");
    xhr.send(formData);
  });
}
