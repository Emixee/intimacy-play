const fs = require('fs');
const path = require('path');

/**
 * Script pour créer google-services.json à partir du secret EAS
 * Le secret de type FILE donne un CHEMIN vers le fichier décodé
 */

const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON;
const targetPath = path.join(__dirname, '..', 'google-services.json');

console.log('🔥 Creating google-services.json...');
console.log('   Environment variable set:', !!GOOGLE_SERVICES_JSON);

if (!GOOGLE_SERVICES_JSON) {
  console.log('⚠️ GOOGLE_SERVICES_JSON not found in environment variables.');
  console.log('   This is expected for local development.');
  process.exit(0);
}

try {
  // Vérifier si c'est un chemin vers un fichier existant (EAS FILE secret)
  if (fs.existsSync(GOOGLE_SERVICES_JSON)) {
    console.log('   Source file found at:', GOOGLE_SERVICES_JSON);
    fs.copyFileSync(GOOGLE_SERVICES_JSON, targetPath);
    console.log('✅ google-services.json copied successfully!');
  } else {
    // Essayer de décoder comme du base64
    console.log('   Trying to decode as base64...');
    const decoded = Buffer.from(GOOGLE_SERVICES_JSON, 'base64').toString('utf8');
    
    // Vérifier que c'est du JSON valide
    JSON.parse(decoded);
    
    fs.writeFileSync(targetPath, decoded);
    console.log('✅ google-services.json created from base64!');
  }
  
  // Vérifier que le fichier existe
  if (fs.existsSync(targetPath)) {
    const stats = fs.statSync(targetPath);
    console.log('   File size:', stats.size, 'bytes');
  }
} catch (error) {
  console.error('❌ Failed to create google-services.json:', error.message);
  console.error('   Value preview:', String(GOOGLE_SERVICES_JSON).substring(0, 100));
  process.exit(1);
}