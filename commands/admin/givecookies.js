const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH = path.join(__dirname, '../../data/cookies.json');

// 👉 Remplace ceci par ton vrai ID Discord
const AUTHORIZED_IDS = ['881571558114590762'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('givecookies')
    .setDescription('🍪 Donne des cookies à un membre (admin seulement)')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Membre à qui donner les cookies')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('quantite')
        .setDescription('Nombre de cookies à donner')
        .setRequired(true)),

  async execute(interaction) {
    // Vérifie que l'auteur est autorisé
    if (!AUTHORIZED_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
    }

    const cible = interaction.options.getUser('utilisateur');
    const montant = interaction.options.getInteger('quantite');

    if (montant <= 0) {
      return interaction.reply({ content: '❌ Le nombre de cookies doit être supérieur à 0.', ephemeral: true });
    }

    let cookies = {};
    try {
      cookies = JSON.parse(fs.readFileSync(COOKIES_PATH));
    } catch (e) {
      console.error(e);
    }

    const actuel = cookies[cible.id] ?? 20;
    cookies[cible.id] = actuel + montant;

    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));

    const embed = new EmbedBuilder()
      .setTitle('🍪 Cookies donnés !')
      .setDescription(`${interaction.user.tag} a donné **${montant}** cookies à ${cible.tag}.\n💰 Nouveau solde : **${cookies[cible.id]}**`)
      .setColor('#00cc66');

    await interaction.reply({ embeds: [embed] });
  },
};
