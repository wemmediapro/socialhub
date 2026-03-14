/**
 * Script de migration pour mettre à jour les statuts des collaborations
 * Anciens statuts: pending, active, completed, cancelled
 * Nouveaux statuts: DRAFT, PENDING_GRAPHIC, CLIENT_REVIEW, SCHEDULED, PUBLISHED, PENDING_CORRECTION, FAILED
 */

const mongoose = require('mongoose');

// Mapping des anciens statuts vers les nouveaux
const statusMapping = {
  'pending': 'DRAFT',
  'active': 'PENDING_GRAPHIC',
  'completed': 'PUBLISHED',
  'cancelled': 'FAILED'
};

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialhub';

async function migrate() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collaborations = db.collection('collaborations');

    // Compter les collaborations à migrer
    const count = await collaborations.countDocuments({
      status: { $in: ['pending', 'active', 'completed', 'cancelled'] }
    });
    
    console.log(`Found ${count} collaborations to migrate`);

    if (count === 0) {
      console.log('No collaborations to migrate');
      await mongoose.disconnect();
      return;
    }

    // Migrer chaque statut
    for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
      const result = await collaborations.updateMany(
        { status: oldStatus },
        { 
          $set: { 
            status: newStatus,
            // Mettre à jour assignedTo selon le nouveau statut
            assignedTo: newStatus === 'DRAFT' ? 'CLIENT' : 
                       newStatus === 'PENDING_GRAPHIC' ? 'INFLUENCER' :
                       newStatus === 'CLIENT_REVIEW' ? 'CLIENT' : undefined
          } 
        }
      );
      console.log(`Migrated ${result.modifiedCount} collaborations from ${oldStatus} to ${newStatus}`);
    }

    // Vérifier qu'il n'y a plus d'anciens statuts
    const remaining = await collaborations.countDocuments({
      status: { $in: ['pending', 'active', 'completed', 'cancelled'] }
    });
    
    if (remaining > 0) {
      console.warn(`Warning: ${remaining} collaborations still have old statuses`);
    } else {
      console.log('Migration completed successfully!');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();

