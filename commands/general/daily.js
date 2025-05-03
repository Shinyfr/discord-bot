const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH   = path.join(__dirname, '../data/cookies.json');
const COOLDOWN_PATH  = path.join(__dirname, '../data/cooldowns.json');
const POWERUPS_PATH  = path.join(__dirname, '../data/powerups.json');
const COOLDOWN_HOURS = 24;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('📅 Récupère ton bonus de cookies quotidien'),

  async execute(interaction) {
    const userId = interaction.user.id;

    // 1) Charger les fichiers
    let cookies   = {};
    let cooldowns = {};
    let powerups  = {};
    try { cookies   = JSON.parse(fs.readFileSync(COOKIES_PATH));   } catch {}
    try { cooldowns = JSON.parse(fs.readFileSync(COOLDOWN_PATH));  } catch {}
    try { powerups  = JSON.parse(fs.readFileSync(POWERUPS_PATH));  } catch {}

    const now       = Date.now();
    const lastClaim = cooldowns[userId] ?? 0;
    const hoursDiff = (now - lastClaim) / 3_600_000;

    // 2) Vérifier le cooldown
    if (hoursDiff < COOLDOWN_HOURS) {
      const rem = Math.ceil(COOLDOWN_HOURS - hoursDiff);
      return interaction.reply({
        content: `⏳ Tu as déjà récupéré ton bonus aujourd’hui.\nRéessaie dans **${rem}h**.`,
        ephemeral: true
      });
    }

    // 3) Calcul du bonus de base
    let bonus = Math.floor(Math.random() * 11) + 10; // 10–20 cookies

    // 4) Gestion des power-ups
    const userPus = Array.isArray(powerups[userId]) ? powerups[userId] : [];

    // Filtrer et supprimer les power-ups expirés
    const validPus = userPus.filter(p => !p.expiresAt || p.expiresAt > now);
    powerups[userId] = validPus;
    fs.writeFileSync(POWERUPS_PATH, JSON.stringify(powerups, null, 2));

    // Appliquer multiplicateur daily s'il existe
    const dailyMul = validPus.find(p => p.id === 'daily_multiplier');
    if (dailyMul) {
      bonus *= 2;
    }

    // Appliquer bonus passif des fermes (cookie_factory, cookie_farm)
    const passiveBonus = validPus
      .filter(p => typeof p.income === 'number')
      .reduce((sum, p) => sum + p.income, 0);
    if (passiveBonus > 0) {
      bonus += passiveBonus;
    }

    // 5) Appliquer et sauvegarder
    cookies[userId]   = (cookies[userId] ?? 0) + bonus;
    cooldowns[userId] = now;
    fs.writeFileSync(COOKIES_PATH,  JSON.stringify(cookies, null, 2));
    fs.writeFileSync(COOLDOWN_PATH, JSON.stringify(cooldowns, null, 2));

    // 6) Préparer la réponse
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
