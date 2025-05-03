const fs = require('fs');
const path = require('path');

const COOLDOWN_PATH = path.join(__dirname, 'data/cooldowns.json');
const userId = '881571558114590762'; // remplace par ton ID

// Charge, supprime et réécrit
const data = fs.existsSync(COOLDOWN_PATH)
  ? JSON.parse(fs.readFileSync(COOLDOWN_PATH, 'utf-8'))
  : {};

if (data[userId]) {
  delete data[userId];
  fs.writeFileSync(COOLDOWN_PATH, JSON.stringify(data, null, 2));
  console.log(`✅ Cooldown daily pour ${userId} réinitialisé.`);
} else {
  console.log(`ℹ️ Pas de cooldown trouvé pour ${userId}.`);
}
