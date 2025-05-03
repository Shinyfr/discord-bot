const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const COOKIE_COST = 5;
const COOKIES_PATH = path.join(__dirname, '../../data/cookies.json');

function getUserCookies(userId) {
  const data = JSON.parse(fs.readFileSync(COOKIES_PATH));
  return data[userId] ?? 0; // solde par défaut
}

function setUserCookies(userId, amount) {
  const data = JSON.parse(fs.readFileSync(COOKIES_PATH));
  data[userId] = amount;
  fs.writeFileSync(COOKIES_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mas')
    .setDescription('🎰 Joue à la machine à cookies !'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const current = getUserCookies(userId);

    const embed = new EmbedBuilder()
      .setTitle('🎰 Machine à cookies')
      .setDescription(`Clique sur le bouton pour jouer !\n💰 **Coût :** ${COOKIE_COST} cookies\n🧾 **Solde :** ${current} cookies`)
      .setColor('#f5c542');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`spin_${userId}`)
        .setLabel('🎰 Spin !')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
