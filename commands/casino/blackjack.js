const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH = path.join(__dirname, '../../data/cookies.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('🃏 Joue au blackjack contre le bot')
    .addIntegerOption(option =>
      option.setName('mise')
        .setDescription('Nombre de cookies à miser')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const mise = interaction.options.getInteger('mise');

    // Charge les cookies
    let cookies = {};
    try {
      cookies = JSON.parse(fs.readFileSync(COOKIES_PATH));
    } catch {}
    const solde = cookies[userId] ?? 20;

    if (mise <= 0) {
      return interaction.reply({ content: "❌ Mise invalide.", ephemeral: true });
    }

    if (mise > solde) {
      return interaction.reply({ content: "❌ Tu n’as pas assez de cookies.", ephemeral: true });
    }

    // Init du jeu
    const draw = () => Math.floor(Math.random() * 10) + 2;
    const joueur = [draw(), draw()];
    const bot = [draw(), draw()];

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`hit_${userId}_${mise}_${joueur.join('_')}_${bot.join('_')}`).setLabel('🃙 Tirer').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`stay_${userId}_${mise}_${joueur.join('_')}_${bot.join('_')}`).setLabel('🛑 Rester').setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setTitle('🃏 Blackjack')
      .setDescription(`Tes cartes : **${joueur.join(', ')}** (total: ${joueur.reduce((a, b) => a + b)})\nCartes du bot : **?** et **?**\n\n🎰 Mise : ${mise} cookies`)
      .setColor('#5865f2');

    await interaction.reply({ embeds: [embed], components: [row] });

    cookies[userId] = solde - mise;
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  }
};
