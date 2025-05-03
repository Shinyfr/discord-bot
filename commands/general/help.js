const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('ℹ️ Affiche l’aide et les règles du casino à cookies'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🍪 Aide – Casino des Cookies')
      .setColor('#00bfff')
      .setDescription(`Voici toutes les commandes disponibles :`)
      .addFields(
        {
          name: '🎰 /mas',
          value: `Joue à la machine à cookies.\nCoût : 5 cookies\nGain : 20 cookies si tu as 3 symboles identiques.`,
        },
        {
          name: '🍪 /cookies',
          value: `Affiche ton solde actuel de cookies.`,
        },
        {
          name: '📅 /daily',
          value: `Réclame un bonus de cookies chaque jour.`,
        },
        {
          name: '🛍️ /shop',
          value: `Découvre des objets à acheter avec tes cookies.`,
        },
        {
          name: '🃏 /blackjack',
          value: `Joue au blackjack contre le bot !`,
        }
      )
      .setFooter({
        text: `Amusez vous bien !`,
        iconURL: interaction.client.user.displayAvatarURL()
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
