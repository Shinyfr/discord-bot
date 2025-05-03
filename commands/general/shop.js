const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SHOP_PATH = path.join(__dirname, '../../data/shop.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('🛍️ Affiche la boutique de CookieBot'),

  async execute(interaction) {
    let shop;
    try {
      shop = JSON.parse(fs.readFileSync(SHOP_PATH, 'utf-8'));
    } catch (err) {
      console.error('Erreur lecture shop.json:', err);
      return interaction.reply({ content: '❌ Impossible de charger la boutique.', ephemeral: true });
    }
    if (!Array.isArray(shop) || shop.length === 0) {
      return interaction.reply({ content: '📭 La boutique est vide pour le moment.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🛍️ Boutique CookieBot')
      .setColor('#f5c542')
      .setDescription('Sélectionne un item dans la liste déroulante pour l’acheter.');

    const options = shop.map(item => ({
      label: item.name,
      value: item.id,
      description: `${item.price} cookies`
    }));

    const menu = new StringSelectMenuBuilder()
      .setCustomId('shop_select')
      .setPlaceholder('Choisis un item à acheter…')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
