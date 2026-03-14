import { NextPage } from 'next';
import Head from 'next/head';

const DataDeletion: NextPage = () => {
  return (
    <>
      <Head>
        <title>Suppression des données - SocialHub Global V5</title>
        <meta name="description" content="Instructions pour la suppression des données utilisateur" />
      </Head>
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <h1>Suppression des données utilisateur</h1>
        
        <h2>Comment demander la suppression de vos données</h2>
        <p>
          Conformément aux réglementations sur la protection des données, vous avez le droit 
          de demander la suppression de vos données personnelles de notre plateforme.
        </p>

        <h3>Données concernées</h3>
        <ul>
          <li>Informations de votre compte (nom, email, profil)</li>
          <li>Données des projets créés</li>
          <li>Historique des posts et publications</li>
          <li>Connexions aux réseaux sociaux</li>
          <li>Logs d'utilisation</li>
        </ul>

        <h3>Comment procéder</h3>
        <ol>
          <li>Connectez-vous à votre compte SocialHub</li>
          <li>Allez dans les Paramètres de votre compte</li>
          <li>Cliquez sur "Supprimer mon compte"</li>
          <li>Confirmez la suppression</li>
        </ol>

        <h3>Alternative par email</h3>
        <p>
          Vous pouvez également nous contacter directement par email :
          <br />
          <strong>Email :</strong> <a href="mailto:socialpro@gmail.com">socialpro@gmail.com</a>
          <br />
          <strong>Objet :</strong> Demande de suppression des données
        </p>

        <p>
          Nous traiterons votre demande dans les 30 jours ouvrés suivant sa réception.
        </p>

        <p><small>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</small></p>
      </div>
    </>
  );
};

export default DataDeletion;





