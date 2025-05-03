const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH = path.join(__dirname, '../../data/cookies.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cookies')
    .setDescription('🍪 Affiche ton nombre de cookies !'),

  async execute(interaction) {
    const userId = interaction.user.id;
    let cookies = {};

    try {
      cookies = JSON.parse(fs.readFileSync(COOKIES_PATH));
    } catch (error) {
      console.error('Erreur lecture cookies.json :', error);
    }

    const solde = cookies[userId] ?? 20; // 20 cookies par défaut

    const embed = new EmbedBuilder()
      .setTitle(`🍪 Solde de cookies`)
      .setDescription(`Tu as **${solde}** cookies.`)
      .setColor('#f5a623')
      .setFooter({ text: `Commandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed] });
    },
};
