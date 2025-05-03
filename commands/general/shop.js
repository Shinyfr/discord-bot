const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SHOP_PATH = path.join(__dirname, '../../data/shop.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('🛍️ Affiche la boutique de CookieBot'),

  async execute(interaction) {
    const shop = JSON.parse(fs.readFileSync(SHOP_PATH));
    const embed = new EmbedBuilder()
      .setTitle('🛍️ Boutique CookieBot')
      .setColor('#f5c542')
      .setDescription('Clique sur un bouton pour acheter.');

    const rows = [];
    for (let i = 0; i < shop.length; i += 5) {
      const slice = shop.slice(i, i + 5);
      const row = new ActionRowBuilder();
      slice.forEach(item => {
        embed.addFields({
          name: `${item.name} — ${item.price} cookies`,
          value: item.description,
          inline: false
        });
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`buy_${item.id}`)
            .setLabel(item.name)
            .setStyle(ButtonStyle.Primary)
        );
      });
      rows.push(row);
    }

    await interaction.reply({ embeds: [embed], components: rows });
  },
};
