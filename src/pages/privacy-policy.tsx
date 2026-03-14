import { NextPage } from 'next';
import Head from 'next/head';

const PrivacyPolicy: NextPage = () => {
  return (
    <>
      <Head>
        <title>Politique de confidentialité - SocialHub Global V5</title>
        <meta name="description" content="Politique de confidentialité de SocialHub Global V5" />
      </Head>
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <h1>Politique de confidentialité</h1>
        
        <h2>1. Collecte des données</h2>
        <p>
          SocialHub Global V5 collecte les données nécessaires pour fonctionner, notamment :
        </p>
        <ul>
          <li>Informations de compte utilisateur (nom, email, rôle)</li>
          <li>Données de connexion aux réseaux sociaux (tokens d'accès)</li>
          <li>Contenu des posts et projets créés</li>
          <li>Métadonnées d'utilisation de la plateforme</li>
        </ul>

        <h2>2. Utilisation des données</h2>
        <p>
          Vos données sont utilisées pour :
        </p>
        <ul>
          <li>Authentification et gestion des comptes</li>
          <li>Publication automatique sur les réseaux sociaux</li>
          <li>Planification et gestion des projets</li>
          <li>Amélioration des services</li>
        </ul>

        <h2>3. Partage des données</h2>
        <p>
          Nous partageons uniquement les données nécessaires avec :
        </p>
        <ul>
          <li>Réseaux sociaux (Facebook, Instagram, TikTok) pour la publication</li>
          <li>Services d'hébergement et de sécurité</li>
        </ul>

        <h2>4. Sécurité</h2>
        <p>
          Nous protégeons vos données avec des mesures de sécurité appropriées et 
          ne stockons jamais vos mots de passe en clair.
        </p>

        <h2>5. Contact</h2>
        <p>
          Pour toute question sur cette politique : 
          <a href="mailto:socialpro@gmail.com">socialpro@gmail.com</a>
        </p>

        <p><small>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</small></p>
      </div>
    </>
  );
};

export default PrivacyPolicy;





