const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const POWERUPS_PATH = path.join(__dirname, '../../data/powerups.json');
// IDs des admins autorisés à révoquer des avantages
const AUTHORIZED_IDS = ['881571558114590762'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeadvantage')
    .setDescription('🔒 Révoque un avantage (power-up) à un membre (admin uniquement)')
    .addUserOption(opt =>
      opt.setName('utilisateur')
         .setDescription('Le membre ciblé')
         .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('powerup')
         .setDescription('ID de l’avantage à retirer')
         .setRequired(true)
    ),

  async execute(interaction) {
    const authorId = interaction.user.id;
    if (!AUTHORIZED_IDS.includes(authorId)) {
      return interaction.reply({ content: '❌ Tu n’as pas la permission.', ephemeral: true });
    }

    const cible = interaction.options.getUser('utilisateur');
    const powerupId = interaction.options.getString('powerup');

    // Charge les powerups
    let p = {};
    if (fs.existsSync(POWERUPS_PATH)) {
      p = JSON.parse(fs.readFileSync(POWERUPS_PATH, 'utf-8'));
    }

    const arr = p[cible.id] || [];
    if (!arr.includes(powerupId)) {
      return interaction.reply({
        content: `❌ ${cible.tag} n'a pas l’avantage \`${powerupId}\`.`,
        ephemeral: true
      });
    }

    // Retire l’avantage
    p[cible.id] = arr.filter(id => id !== powerupId);
    fs.writeFileSync(POWERUPS_PATH, JSON.stringify(p, null, 2));

    const embed = new EmbedBuilder()
      .setTitle('🔒 Avantage révoqué')
      .setDescription(`${interaction.user.tag} a retiré **${powerupId}** à ${cible.tag}.`)
      .setColor('#ff5555');

    await interaction.reply({ embeds: [embed] });
  }
};
