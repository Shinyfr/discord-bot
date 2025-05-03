const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH   = path.join(__dirname, '../../data/cookies.json');
const COOLDOWN_PATH  = path.join(__dirname, '../../data/cooldowns.json');
const POWERUPS_PATH  = path.join(__dirname, '../../data/powerups.json');
const COOLDOWN_HOURS = 24;

// Remplace par ton ID Discord pour ignorer le cooldown
const TEST_USER_ID = '881571558114590762';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('📅 Récupère ton bonus de cookies quotidien'),

  async execute(interaction) {
    const userId = interaction.user.id;

    // 1) Charger les fichiers
    let cookies = {};
    let cooldowns = {};
    let powerups = {};
    try { cookies = JSON.parse(fs.readFileSync(COOKIES_PATH)); } catch {}
    try { cooldowns = JSON.parse(fs.readFileSync(COOLDOWN_PATH)); } catch {}
    try { powerups = JSON.parse(fs.readFileSync(POWERUPS_PATH)); } catch {}

    const now = Date.now();

    // 2) Gestion du cooldown (override pour le user de test)
    let lastClaim = cooldowns[userId] ?? 0;
    if (userId === TEST_USER_ID) lastClaim = 0;
    const hoursDiff = (now - lastClaim) / 3_600_000;

    if (userId !== TEST_USER_ID && hoursDiff < COOLDOWN_HOURS) {
      const rem = Math.ceil(COOLDOWN_HOURS - hoursDiff);
      return interaction.reply({
        content: `⏳ Tu as déjà récupéré ton bonus aujourd'hui.\nRéessaie dans **${rem}h**.`,
        ephemeral: true
      });
    }

    // 3) Calcul du bonus de base
    let bonus = Math.floor(Math.random() * 11) + 10; // 10–20 cookies

    // 4) Gestion des power-ups
    const userPus = Array.isArray(powerups[userId]) ? powerups[userId] : [];
    const validPus = userPus.filter(p => !p.expiresAt || p.expiresAt > now);
    powerups[userId] = validPus;
    fs.writeFileSync(POWERUPS_PATH, JSON.stringify(powerups, null, 2));

    // multiplicateur daily
    const dailyMul = validPus.find(p => p.id === 'daily_multiplier');
    if (dailyMul) bonus *= 2;

    // bonus passif des fermes
    const passiveBonus = validPus
      .filter(p => typeof p.income === 'number')
      .reduce((sum, p) => sum + p.income, 0);
    if (passiveBonus > 0) bonus += passiveBonus;

    // 5) Appliquer et sauvegarder
    cookies[userId] = (cookies[userId] ?? 0) + bonus;
    cooldowns[userId] = now;
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    fs.writeFileSync(COOLDOWN_PATH, JSON.stringify(cooldowns, null, 2));

    // 6) Préparer et envoyer la réponse
    let description = `Tu as reçu **${bonus} cookies** !`;
    if (dailyMul) description += `\n(×2 grâce à ton Multiplicateur /daily)`;
    if (passiveBonus > 0) description += `\n(+ **${passiveBonus}** cookies bonus)`;
    description += `\n💰 Solde actuel : **${cookies[userId]}** cookies`;

    const embed = new EmbedBuilder()
      .setTitle('🎁 Bonus quotidien')
      .setDescription(description)
      .setColor('#FFD700');

    await interaction.reply({ embeds: [embed] });
  }
};
