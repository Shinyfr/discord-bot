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

    // Ajouter des cookies par défaut (20) aux utilisateurs qui n'ont pas encore de cookies enregistrés
    // Pas besoin de récupérer tous les membres ici, simplement les utilisateurs qui existent déjà
    const users = Object.keys(cookies);
    if (users.length === 0) {
      return interaction.reply({ content: "Le fichier cookies.json est vide. Aucun utilisateur n'a encore interagi avec le bot.", ephemeral: true });
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
