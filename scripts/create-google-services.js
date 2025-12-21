const fs = require('fs');
const path = require('path');

/**
 * Script pour créer google-services.json à partir du secret EAS
 * Exécuté avant le prebuild sur EAS Build
 */

const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON;

if (!GOOGLE_SERVICES_JSON) {
  console.log('⚠️ GOOGLE_SERVICES_JSON not found in environment variables.');
  console.log('   This is expected for local development.');
  console.log('   For EAS Build, ensure the secret is configured.');
  process.exit(0);
}

const targetPath = path.join(__dirname, '..', 'google-services.json');

try {
  // Le secret est stocké en base64, on le décode
  const decoded = Buffer.from(GOOGLE_SERVICES_JSON, 'base64').toString('utf8');
  
  // Vérifier que c'est du JSON valide
  JSON.parse(decoded);
  
  fs.writeFileSync(targetPath, decoded);
  console.log('✅ google-services.json created successfully');
} catch (error) {
  console.error('❌ Failed to create google-services.json:', error.message);
  process.exit(1);
}