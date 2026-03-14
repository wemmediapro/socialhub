import axios from 'axios';

type EmailTemplate = {
  to: string;
  toName: string;
  subject: string;
  html: string;
  text?: string;
};

// Email templates for different notification types
export function getEmailTemplate(
  type: string,
  recipientName: string,
  data: any
): { subject: string; html: string } {
  
  const templates: Record<string, any> = {
    POST_CREATED: {
      subject: "📝 Nouveau post à créer",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ec4899, #db2777); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 40px;">
                📝
              </div>
            </div>
            
            <h1 style="color: #111; font-size: 24px; margin-bottom: 16px; text-align: center;">
              Bonjour ${recipientName} !
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Un nouveau post vous a été assigné et attend votre création :
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
              <p style="margin: 0; color: #111; font-weight: 600; margin-bottom: 8px;">
                ${data.postDescription || "Nouveau post"}
              </p>
              <p style="margin: 0; color: #999; font-size: 14px;">
                📅 Date de publication : ${data.scheduledDate || "À définir"}
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.link || 'http://localhost:3000/workflow'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #ec4899, #db2777); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Voir le post →
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>SocialHub Global • Gestion de contenu social media</p>
          </div>
        </div>
      `
    },

    CONTENT_UPLOADED: {
      subject: "📤 Nouveau contenu à valider",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 40px;">
                📤
              </div>
            </div>
            
            <h1 style="color: #111; font-size: 24px; margin-bottom: 16px; text-align: center;">
              Bonjour ${recipientName} !
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              ${data.creatorName} a uploadé le contenu pour le post suivant :
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
              <p style="margin: 0; color: #111; font-weight: 600; margin-bottom: 8px;">
                ${data.postDescription || "Post"}
              </p>
              <p style="margin: 0; color: #999; font-size: 14px;">
                ✅ Contenu prêt pour validation
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.link || 'http://localhost:3000/workflow'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Valider le contenu →
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>SocialHub Global • Gestion de contenu social media</p>
          </div>
        </div>
      `
    },

    CLIENT_VALIDATED: {
      subject: "✅ Votre contenu a été validé !",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 40px;">
                ✅
              </div>
            </div>
            
            <h1 style="color: #111; font-size: 24px; margin-bottom: 16px; text-align: center;">
              Félicitations ${recipientName} !
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
              Le client a validé votre création pour :
            </p>
            
            <div style="background: #d1fae5; padding: 20px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #065f46; font-weight: 600; margin-bottom: 8px;">
                ${data.postDescription || "Post"}
              </p>
              <p style="margin: 0; color: #059669; font-size: 14px;">
                ✅ Prêt pour la planification et publication
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.link || 'http://localhost:3000/workflow'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Voir le workflow →
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>SocialHub Global • Gestion de contenu social media</p>
          </div>
        </div>
      `
    },

    CLIENT_REJECTED: {
      subject: "❌ Correction demandée",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 40px;">
                ❌
              </div>
            </div>
            
            <h1 style="color: #111; font-size: 24px; margin-bottom: 16px; text-align: center;">
              Correction demandée
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Le client a demandé une correction pour :
            </p>
            
            <div style="background: #fee2e2; padding: 20px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #ef4444;">
              <p style="margin: 0; color: #991b1b; font-weight: 600; margin-bottom: 8px;">
                ${data.postDescription || "Post"}
              </p>
              <p style="margin: 0; color: #dc2626; font-size: 14px;">
                💬 ${data.reason || "Voir les commentaires pour plus de détails"}
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.link || 'http://localhost:3000/workflow'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Voir les corrections →
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>SocialHub Global • Gestion de contenu social media</p>
          </div>
        </div>
      `
    },

    POST_PUBLISHED: {
      subject: "🚀 Votre post a été publié !",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 40px;">
                🚀
              </div>
            </div>
            
            <h1 style="color: #111; font-size: 24px; margin-bottom: 16px; text-align: center;">
              Post publié avec succès !
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
              Votre contenu est maintenant en ligne :
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
              <p style="margin: 0; color: #111; font-weight: 600; margin-bottom: 16px;">
                ${data.postDescription || "Post"}
              </p>
              ${data.reach ? `
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
                  <div>
                    <div style="font-size: 24px; font-weight: 800; color: #6366f1;">${data.reach}</div>
                    <div style="font-size: 12px; color: #999;">REACH</div>
                  </div>
                  <div>
                    <div style="font-size: 24px; font-weight: 800; color: #ec4899;">${data.likes || 0}</div>
                    <div style="font-size: 12px; color: #999;">LIKES</div>
                  </div>
                  <div>
                    <div style="font-size: 24px; font-weight: 800; color: #10b981;">${data.engagement || 0}</div>
                    <div style="font-size: 12px; color: #999;">ENGAGEMENT</div>
                  </div>
                </div>
              ` : ""}
            </div>
            
            <div style="text-align: center;">
              <a href="${data.link || 'http://localhost:3000/workflow'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Voir les statistiques →
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>SocialHub Global • Gestion de contenu social media</p>
          </div>
        </div>
      `
    },

    DEADLINE_APPROACHING: {
      subject: "⏰ Deadline proche !",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 40px;">
                ⏰
              </div>
            </div>
            
            <h1 style="color: #111; font-size: 24px; margin-bottom: 16px; text-align: center;">
              Attention ${recipientName} !
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
              La deadline approche pour :
            </p>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-weight: 600; margin-bottom: 8px;">
                ${data.postDescription || "Post"}
              </p>
              <p style="margin: 0; color: #d97706; font-size: 14px;">
                ⏰ Deadline dans ${data.daysLeft} jour${data.daysLeft > 1 ? "s" : ""}
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.link || 'http://localhost:3000/workflow'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Travailler dessus →
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>SocialHub Global • Gestion de contenu social media</p>
          </div>
        </div>
      `
    },

    COMMENT_ADDED: {
      subject: "💬 Nouveau commentaire",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 40px;">
                💬
              </div>
            </div>
            
            <h1 style="color: #111; font-size: 24px; margin-bottom: 16px; text-align: center;">
              Nouveau commentaire
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              ${data.commenterName} a ajouté un commentaire :
            </p>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af; font-style: italic; line-height: 1.6;">
                "${data.comment}"
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.link || 'http://localhost:3000/workflow'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Répondre →
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>SocialHub Global • Gestion de contenu social media</p>
          </div>
        </div>
      `
    },

    COLLAB_CREATED: {
      subject: "🤝 Nouvelle collaboration !",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 40px;">
                🤝
              </div>
            </div>
            
            <h1 style="color: #111; font-size: 24px; margin-bottom: 16px; text-align: center;">
              Bonjour ${recipientName} !
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
              Vous avez été invité à collaborer sur un projet :
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
              <p style="margin: 0; color: #111; font-weight: 600; margin-bottom: 12px;">
                ${data.projectName || "Projet"}
              </p>
              <p style="margin: 0; color: #10b981; font-size: 18px; font-weight: 700;">
                💰 Budget : ${data.budget}€
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.link || 'http://localhost:3000/collab'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Voir la collaboration →
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>SocialHub Global • Gestion de contenu social media</p>
          </div>
        </div>
      `
    },

    COLLAB_INVITE: {
      subject: "🤝 Invitation à rejoindre un projet MediaPro",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 40px;">
                🤝
              </div>
            </div>
            
            <h1 style="color: #111; font-size: 24px; margin-bottom: 16px; text-align: center;">
              Bonjour ${recipientName} !
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Vous avez été invité à rejoindre un projet de collaboration sur <strong>MediaPro Social Hub</strong>.
            </p>
            
            ${data.message ? `
              <div style="background: #d1fae5; padding: 20px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #065f46; line-height: 1.6;">
                  "${data.message}"
                </p>
              </div>
            ` : ""}
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
              <p style="margin: 0; color: #111; font-weight: 600; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Détails de l'invitation
              </p>
              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.8;">
                <strong>Rôle :</strong> Influenceur<br/>
                <strong>Projet :</strong> ${data.projectName || 'Projet de collaboration'}
              </p>
            </div>
            
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${data.link || 'http://localhost:3000/collab'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                Rejoindre le projet →
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                MediaPro Social Hub • Plateforme de gestion de contenu social
              </p>
            </div>
          </div>
        </div>
      `
    }
  };

  const defaultTemplate = {
    subject: data.title || "Notification SocialHub",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px;">
          <h1 style="color: #111; font-size: 24px; margin-bottom: 16px;">
            ${data.title}
          </h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ${data.message}
          </p>
          ${data.link ? `
            <div style="margin-top: 24px; text-align: center;">
              <a href="${data.link}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
                Voir plus →
              </a>
            </div>
          ` : ""}
        </div>
      </div>
    `
  };

  return templates[type] || defaultTemplate;
}

// Send email using your email service (Resend, SendGrid, etc.)
export async function sendEmail(params: EmailTemplate) {
  try {
    // Option 1: Using Resend (recommended)
    if (process.env.RESEND_API_KEY) {
      const response = await axios.post('https://api.resend.com/emails', {
        from: 'SocialHub <notifications@socialhub.com>',
        to: params.to,
        subject: params.subject,
        html: params.html
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      return { success: true, data: response.data };
    }
    
    // Option 2: Using SendGrid
    if (process.env.SENDGRID_API_KEY) {
      const response = await axios.post('https://api.sendgrid.com/v3/mail/send', {
        personalizations: [{
          to: [{ email: params.to, name: params.toName }],
          subject: params.subject
        }],
        from: { email: 'notifications@socialhub.com', name: 'SocialHub' },
        content: [
          { type: 'text/html', value: params.html }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      return { success: true, data: response.data };
    }

    // Option 3: Using Nodemailer (for testing/local)
    // Would need to setup nodemailer separately
    
    // If no email service configured, just log
    console.log('📧 EMAIL (not sent - no service configured):', {
      to: params.to,
      subject: params.subject
    });
    
    return { success: false, message: 'No email service configured' };
    
  } catch (error: any) {
    console.error('Error sending email:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// Send notification email
export async function sendNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  notificationType: string,
  data: any
) {
  const template = getEmailTemplate(notificationType, recipientName, data);
  
  return await sendEmail({
    to: recipientEmail,
    toName: recipientName,
    subject: template.subject,
    html: template.html
  });
}

