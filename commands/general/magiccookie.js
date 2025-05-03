const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH    = path.join(__dirname, '../../data/cookies.json');
const POWERUPS_PATH   = path.join(__dirname, '../../data/powerups.json');
const COOLDOWNS_PATH  = path.join(__dirname, '../../data/cooldowns.json');

const COOLDOWN_MS = 60 * 60 * 1000; // 1 heure

module.exports = {
  data: new SlashCommandBuilder()
    .setName('magiccookie')
    .setDescription('✨ Invoque un cookie magique (1×/heure si tu as le power-up)'), 

  async execute(interaction) {
    const uid = interaction.user.id;

    // Charge les power-ups
    let powerups = {};
    if (fs.existsSync(POWERUPS_PATH)) {
      powerups = JSON.parse(fs.readFileSync(POWERUPS_PATH, 'utf-8'));
    }
    if (! (powerups[uid] || []).includes('magic_cookie')) {
      return interaction.reply({
        content: '❌ Tu n’as pas accès à cette commande (achète d’abord Magic Cookie).',
        ephemeral: true
      });
    }

    // Charge les cooldowns
    let cds = {};
    if (fs.existsSync(COOLDOWNS_PATH)) {
      try {
        cds = JSON.parse(fs.readFileSync(COOLDOWNS_PATH, 'utf-8'));
      } catch { cds = {}; }
    }
    cds.magiccookie = cds.magiccookie || {};
    const last = cds.magiccookie[uid] || 0;
    const now  = Date.now();
    const diff = now - last;
    if (diff < COOLDOWN_MS) {
      const remain = COOLDOWN_MS - diff;
      const minutes = Math.floor(remain / 60000);
      const seconds = Math.floor((remain % 60000) / 1000);
      return interaction.reply({
        content: `❌ Cooldown : reviens dans ${minutes}m${seconds}s pour invoquer à nouveau.`,
        ephemeral: true
      });
    }

    // Met à jour le cooldown
    cds.magiccookie[uid] = now;
    fs.writeFileSync(COOLDOWNS_PATH, JSON.stringify(cds, null, 2));

    // Donne un gain aléatoire
    const gain = Math.floor(Math.random() * 5) + 1;

    // Mets à jour le solde
    let cookies = {};
    if (fs.existsSync(COOKIES_PATH)) {
      cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
    }
    cookies[uid] = (cookies[uid] || 0) + gain;
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));

    const embed = new EmbedBuilder()
      .setTitle('✨ Cookie Magique')
      .setDescription(`🪄 Tu as invoqué un cookie magique et gagné **${gain}** cookies !`)
      .setColor('#d4af37');

    return interaction.reply({ embeds: [embed] });
  }
};
