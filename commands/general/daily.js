const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH   = path.join(__dirname, '../../data/cookies.json');
const COOLDOWN_PATH  = path.join(__dirname, '../../data/cooldowns.json');

// Remplace par ton ID Discord pour ignorer le cooldown lors des tests
const TEST_USER_ID = '';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('📅 Récupère ton bonus de cookies quotidien'),

  async execute(interaction) {
    const userId = interaction.user.id;

    // 1) Charger les fichiers
    let cookies = {};
    let cooldowns = {};
    try { cookies = JSON.parse(fs.readFileSync(COOKIES_PATH)); } catch {}
    try { cooldowns = JSON.parse(fs.readFileSync(COOLDOWN_PATH)); } catch {}

    const now = Date.now();
    let lastClaim = cooldowns[userId] ?? 0;

    // Calcul du début de la journée courante (00:00:00)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 2) Vérifier si l'utilisateur a déjà réclamé aujourd'hui
    //    (sauf pour l'utilisateur de test qui bypass le cooldown)
    if (userId !== TEST_USER_ID && lastClaim > startOfToday.getTime()) {
      return interaction.reply({
        content: `⏳ Tu as déjà récupéré ton bonus aujourd'hui. Réessaie demain à minuit !`,
        ephemeral: true
      });
    }

    // 3) Calcul du bonus aléatoire
    const bonus = Math.floor(Math.random() * 11) + 10; // 10–20 cookies

    // 4) Appliquer et sauvegarder
    cookies[userId] = (cookies[userId] ?? 0) + bonus;
    cooldowns[userId] = now;
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    fs.writeFileSync(COOLDOWN_PATH, JSON.stringify(cooldowns, null, 2));

    // 5) Envoyer la réponse
    const embed = new EmbedBuilder()
      .setTitle('🎁 Bonus quotidien')
      .setDescription(
        `Tu as reçu **${bonus} cookies** !` +
        `\n💰 Solde actuel : **${cookies[userId]}** cookies`
      )
      .setColor('#FFD700');

    await interaction.reply({ embeds: [embed] });
  }
};
