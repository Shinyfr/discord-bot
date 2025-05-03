const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Lecture du fichier des cookies
const COOKIES_PATH = path.join(__dirname, '../../data/cookies.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('🍪 Affiche le classement des meilleurs joueurs avec le plus de cookies !'),

  async execute(interaction) {
    let cookies = {};

    try {
      cookies = JSON.parse(fs.readFileSync(COOKIES_PATH));
    } catch (error) {
      console.error('Erreur lecture cookies.json :', error);
    }

    // Ajouter 0 cookies par défaut pour les utilisateurs qui n'ont pas encore de cookies enregistrés
    for (const userId in cookies) {
      if (cookies[userId] === undefined) {
        cookies[userId] = 0; // Attribuer 0 cookies par défaut si le solde est inexistant
      }
    }

    // Trier les joueurs par nombre de cookies (du plus grand au plus petit)
    const sortedPlayers = Object.entries(cookies)
      .sort(([, a], [, b]) => b - a) // Tri par nombre de cookies
      .slice(0, 10); // Limiter aux 10 premiers joueurs

    // Générer le leaderboard
    let leaderboard = '';
    sortedPlayers.forEach(([userId, cookiesAmount], index) => {
      leaderboard += `**${index + 1}.** <@${userId}> - **${cookiesAmount}** cookies\n`;
    });

    // Embed de l'affichage
    const embed = new EmbedBuilder()
      .setTitle('🍪 Top 10 des meilleurs joueurs')
      .setDescription(leaderboard || 'Il n\'y a pas encore de données.')
      .setColor('#f5c542')
      .setFooter({ text: `Commandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
  },
};
