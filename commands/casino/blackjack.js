const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Lecture du fichier des cookies
const COOKIES_PATH = path.join(__dirname, '../../data/cookies.json');

function getUserCookies(userId) {
  const data = JSON.parse(fs.readFileSync(COOKIES_PATH));
  return data[userId] ?? 20; // solde par défaut
}

function setUserCookies(userId, amount) {
  const data = JSON.parse(fs.readFileSync(COOKIES_PATH));
  data[userId] = amount;
  fs.writeFileSync(COOKIES_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('🃏 Joue au blackjack avec tes cookies !')
    .addIntegerOption(option => 
      option.setName('mise')
        .setDescription('Le montant à parier')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const mise = interaction.options.getInteger('mise');

    // Vérifie que le joueur a assez de cookies pour parier
    let cookies = JSON.parse(fs.readFileSync(COOKIES_PATH));
    const currentCookies = cookies[userId] ?? 20;

    if (currentCookies < mise) {
      return interaction.reply({ content: "❌ Tu n'as pas assez de cookies pour cette mise !", ephemeral: true });
    }

    // Retirer la mise du solde du joueur
    cookies[userId] = currentCookies - mise;
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));

    // Cartes du joueur et du bot
    const drawCard = () => Math.floor(Math.random() * 10) + 2; // Tirage d'une carte entre 2 et 11 (as = 11 ici)
    const playerCards = [drawCard(), drawCard()];
    const botCards = [drawCard(), drawCard()];

    const playerTotal = playerCards.reduce((a, b) => a + b, 0);
    const botTotal = botCards.reduce((a, b) => a + b, 0);

    const embed = new EmbedBuilder()
      .setTitle('🃏 Blackjack')
      .setDescription(`Mise : ${mise} cookies\n\nTes cartes : ${playerCards.join(' | ')} (total: ${playerTotal})\nCartes du bot : ${botCards[0]} | ?`)
      .setColor('#5865f2');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`hit_${userId}_${mise}_${playerCards.join('_')}_${botCards.join('_')}`).setLabel('🃙 Tirer').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`stay_${userId}_${mise}_${playerCards.join('_')}_${botCards.join('_')}`).setLabel('🛑 Rester').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
