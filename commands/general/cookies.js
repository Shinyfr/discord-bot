const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH = path.join(__dirname, '../../data/cookies.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cookies')
    .setDescription('🍪 Affiche ton solde de cookies ou celui d’un autre membre')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Utilisateur dont tu veux voir le solde')
        .setRequired(false)
    ),

  async execute(interaction) {
    const cible = interaction.options.getUser('utilisateur') ?? interaction.user;
    const cookies = fs.existsSync(COOKIES_PATH)
      ? JSON.parse(fs.readFileSync(COOKIES_PATH))
      : {};

    const solde = cookies[cible.id] ?? 0;

    const embed = new EmbedBuilder()
      .setTitle('🍪 Solde de cookies')
      .setDescription(`👤 ${cible.username} possède **${solde}** cookies.`)
      .setColor('#f5a623')
      .setFooter({ text: `Demandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
  }
};
