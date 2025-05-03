const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH = path.join(__dirname, '../../data/cookies.json');
const COOLDOWN_PATH = path.join(__dirname, '../../data/cooldowns.json');
const COOLDOWN_HOURS = 24;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('📅 Récupère ton bonus de cookies quotidien'),

  async execute(interaction) {
    const userId = interaction.user.id;

    let cookies = {};
    let cooldowns = {};

    // Chargement des fichiers
    try {
      cookies = JSON.parse(fs.readFileSync(COOKIES_PATH));
    } catch {}
    try {
      cooldowns = JSON.parse(fs.readFileSync(COOLDOWN_PATH));
    } catch {}

    const now = Date.now();
    const lastClaim = cooldowns[userId] ?? 0;
    const diffHours = (now - lastClaim) / (1000 * 60 * 60);

    if (diffHours < COOLDOWN_HOURS) {
      const remaining = Math.ceil(COOLDOWN_HOURS - diffHours);
      return interaction.reply({
        content: `⏳ Tu as déjà récupéré ton bonus aujourd’hui.\nRéessaie dans **${remaining}h**.`,
        ephemeral: true
      });
    }

    // Donne un bonus aléatoire
    const bonus = Math.floor(Math.random() * 11) + 10; // 10 à 20 cookies
    cookies[userId] = (cookies[userId] ?? 20) + bonus;
    cooldowns[userId] = now;

    // Sauvegarde
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    fs.writeFileSync(COOLDOWN_PATH, JSON.stringify(cooldowns, null, 2));

    const embed = new EmbedBuilder()
      .setTitle('🎁 Bonus quotidien')
      .setDescription(`Tu as reçu **${bonus} cookies** !\n💰 Solde actuel : **${cookies[userId]}** cookies`)
      .setColor('#FFD700');

    await interaction.reply({ embeds: [embed] });
  }
};
