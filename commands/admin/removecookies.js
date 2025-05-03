const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const COOKIES_PATH = path.join(__dirname, '../../data/cookies.json');

const AUTHORIZED_IDS = ['881571558114590762'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removecookies')
    .setDescription('🔧 Retire des cookies à un membre (admin uniquement)')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Le membre dont tu veux enlever des cookies')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('quantite')
        .setDescription('Nombre de cookies à retirer')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Vérification permission
    if (!AUTHORIZED_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
    }

    const cible = interaction.options.getUser('utilisateur');
    const montant = interaction.options.getInteger('quantite');

    if (montant <= 0) {
      return interaction.reply({ content: '❌ Le nombre de cookies doit être supérieur à 0.', ephemeral: true });
    }

    // Lecture & mise à jour du solde
    let cookies = {};
    try {
      cookies = JSON.parse(fs.readFileSync(COOKIES_PATH));
    } catch (e) {
      console.error(e);
      cookies = {};
    }

    const actuel = cookies[cible.id] ?? 0;
    const nouveau = Math.max(0, actuel - montant);
    cookies[cible.id] = nouveau;

    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));

    // Embed de confirmation
    const embed = new EmbedBuilder()
      .setTitle('🔧 Cookies retirés')
      .setDescription(`${interaction.user.tag} a retiré **${montant}** cookies à ${cible.tag}.\n💰 Nouveau solde : **${nouveau}** cookies`)
      .setColor('#ff5555');

    await interaction.reply({ embeds: [embed] });
  },
};
