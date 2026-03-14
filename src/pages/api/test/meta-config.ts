import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

interface TestResult {
  test: string;
  status: "success" | "error" | "warning";
  message: string;
  data?: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const results: TestResult[] = [];
  
  // Test 1: Vérifier la présence des variables d'environnement
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;

  results.push({
    test: "Variables d'environnement",
    status: (appId && appSecret && redirectUri) ? "success" : "error",
    message: appId && appSecret && redirectUri 
      ? "✅ Toutes les variables sont configurées"
      : `❌ Variables manquantes: ${!appId ? "META_APP_ID " : ""}${!appSecret ? "META_APP_SECRET " : ""}${!redirectUri ? "META_REDIRECT_URI" : ""}`,
    data: {
      hasAppId: !!appId,
      hasAppSecret: !!appSecret,
      hasRedirectUri: !!redirectUri,
      appIdPreview: appId ? `${appId.substring(0, 10)}...` : "Non configuré",
      redirectUri: redirectUri || "Non configuré"
    }
  });

  // Test 2: Vérifier le format de l'App ID (doit être numérique)
  if (appId) {
    const isValidAppId = /^\d+$/.test(appId);
    results.push({
      test: "Format App ID",
      status: isValidAppId ? "success" : "error",
      message: isValidAppId 
        ? "✅ Format App ID valide (numérique)"
        : "❌ Format App ID invalide (doit être numérique)",
      data: { appId: appId.substring(0, 10) + "..." }
    });
  }

  // Test 3: Vérifier le format de l'App Secret (doit être une chaîne alphanumérique)
  if (appSecret) {
    const isValidSecret = appSecret.length >= 32 && /^[a-f0-9]+$/i.test(appSecret);
    results.push({
      test: "Format App Secret",
      status: isValidSecret ? "success" : "warning",
      message: isValidSecret 
        ? "✅ Format App Secret valide"
        : "⚠️ Format App Secret suspect (doit être une chaîne hexadécimale d'au moins 32 caractères)",
      data: { secretLength: appSecret.length }
    });
  }

  // Test 4: Tester la connexion à l'API Facebook Graph (sans token utilisateur)
  if (appId && appSecret) {
    try {
      // Test avec App Access Token (pour vérifier que les credentials sont valides)
      const appAccessTokenResponse = await axios.get(
        `https://graph.facebook.com/v19.0/oauth/access_token`,
        {
          params: {
            client_id: appId,
            client_secret: appSecret,
            grant_type: "client_credentials"
          },
          timeout: 5000
        }
      );

      if (appAccessTokenResponse.data.access_token) {
        const appAccessToken = appAccessTokenResponse.data.access_token;
        
        // Test avec l'App Access Token pour obtenir les infos de l'app
        try {
          const appInfoResponse = await axios.get(
            `https://graph.facebook.com/v19.0/${appId}`,
            {
              params: {
                access_token: appAccessToken,
                fields: "id,name,category"
              },
              timeout: 5000
            }
          );

          results.push({
            test: "Connexion API Facebook",
            status: "success",
            message: "✅ Connexion réussie ! Les credentials sont valides",
            data: {
              appName: appInfoResponse.data.name || "N/A",
              appCategory: appInfoResponse.data.category || "N/A",
              appId: appInfoResponse.data.id
            }
          });
        } catch (infoError: any) {
          results.push({
            test: "Connexion API Facebook",
            status: "warning",
            message: `⚠️ Token obtenu mais erreur lors de la récupération des infos: ${infoError.message}`,
            data: { error: infoError.response?.data || infoError.message }
          });
        }
      }
    } catch (error: any) {
      results.push({
        test: "Connexion API Facebook",
        status: "error",
        message: `❌ Erreur de connexion: ${error.response?.data?.error?.message || error.message}`,
        data: {
          error: error.response?.data || error.message,
          hint: "Vérifiez que META_APP_ID et META_APP_SECRET sont corrects dans Facebook Developers"
        }
      });
    }
  }

  // Test 5: Vérifier l'URL de redirection
  if (redirectUri) {
    const isValidUrl = /^https?:\/\//.test(redirectUri);
    const isLocalhost = redirectUri.includes("localhost") || redirectUri.includes("127.0.0.1");
    
    results.push({
      test: "URL de redirection",
      status: isValidUrl ? "success" : "error",
      message: isValidUrl 
        ? (isLocalhost 
          ? "✅ URL de redirection valide (localhost pour développement)"
          : "✅ URL de redirection valide")
        : "❌ URL de redirection invalide (doit commencer par http:// ou https://)",
      data: {
        redirectUri: redirectUri,
        isLocalhost: isLocalhost,
        hint: isLocalhost 
          ? "Pour la production, utilisez votre domaine réel"
          : "Assurez-vous que cette URL est configurée dans Facebook App Settings > Valid OAuth Redirect URIs"
      }
    });
  }

  // Résumé
  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;
  const warningCount = results.filter(r => r.status === "warning").length;

  return res.status(200).json({
    summary: {
      total: results.length,
      success: successCount,
      errors: errorCount,
      warnings: warningCount,
      overall: errorCount === 0 ? (warningCount === 0 ? "success" : "warning") : "error"
    },
    results: results,
    nextSteps: errorCount === 0 
      ? [
          "✅ Configuration valide !",
          "Vous pouvez maintenant tester l'authentification OAuth en visitant: /api/auth/meta/login",
          "Assurez-vous que l'URL de redirection est bien configurée dans Facebook App Settings"
        ]
      : [
          "❌ Des erreurs ont été détectées",
          "Vérifiez les résultats ci-dessus et corrigez les problèmes",
          "Consultez https://developers.facebook.com/apps/ pour vérifier vos credentials"
        ]
  });
}


