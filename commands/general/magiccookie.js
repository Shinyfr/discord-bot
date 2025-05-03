const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH = path.join(__dirname, '../../data/cookies.json');
const POWERUPS_PATH = path.join(__dirname, '../../data/powerups.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('magiccookie')
    .setDescription('✨ Invoque un cookie magique (si tu as acheté le power-up)'), 

  async execute(interaction) {
    const uid = interaction.user.id;

    // Charge tes powerups
    let powerups = {};
    if (fs.existsSync(POWERUPS_PATH)) {
      powerups = JSON.parse(fs.readFileSync(POWERUPS_PATH, 'utf-8'));
    }

    // Vérifie que l'utilisateur a bien acheté magiccookie
    if (!(powerups[uid] || []).includes('magic_cookie')) {
      return interaction.reply({
        content: '❌ Tu n’as pas accès à cette commande (achète d’abord Magic Cookie).',
        ephemeral: true
      });
    }

    // Donne un cookie magique aléatoire entre 1 et 5
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
