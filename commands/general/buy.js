const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SHOP_PATH = path.join(__dirname, '../../data/shop.json');
const COOKIES_PATH = path.join(__dirname, '../../data/cookies.json');
const POWERUPS_PATH = path.join(__dirname, '../../data/powerups.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('💸 Achète un item dans la boutique')
    .addStringOption(opt =>
      opt.setName('item')
         .setDescription('ID de l’item à acheter')
         .setRequired(true)
    ),

  async execute(interaction) {
    const itemId = interaction.options.getString('item');
    const shop = JSON.parse(fs.readFileSync(SHOP_PATH));
    const item = shop.find(i => i.id === itemId);
    if (!item) {
      return interaction.reply({ content: '❌ Item invalide.', ephemeral: true });
    }

    // Charge les cookies
    const cookies = fs.existsSync(COOKIES_PATH)
      ? JSON.parse(fs.readFileSync(COOKIES_PATH))
      : {};
    const userId = interaction.user.id;
    const solde = cookies[userId] ?? 0;

    if (solde < item.price) {
      return interaction.reply({ content: '❌ Solde insuffisant.', ephemeral: true });
    }

    // Retire le coût
    cookies[userId] = solde - item.price;
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));

    // Applique la récompense
    let message = '';
    switch (item.type) {
        case 'role':
          await interaction.member.roles.add(item.roleId);
          message = `Tu as reçu le rôle **${item.name}** !`;
          break;
        case 'emoji':
          // On débite, puis l'utilisateur pourra t'envoyer son emoji manuellement
          message = `✅ Tu as acheté **${item.name}** !\n` +
                    `👉 Envoie-moi maintenant l’emoji que tu souhaites ajouter au serveur.`;
          break;
      case 'permission':
        // On stocke dans powerups pour autoriser l’usage
        savePowerup(userId, item.id);
        message = `Tu peux désormais utiliser la commande **/${item.permission}** !`;
        break;
      case 'mystery':
        const gain = Math.floor(Math.random()*101);
        cookies[userId] += gain;
        fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
        message = `Mystery Box ouverte : tu obtiens **${gain}** cookies !`;
        break;
      case 'multiplier':
      case 'passive':
        savePowerup(userId, item.id);
        message = `Item **${item.name}** ajouté à tes power-ups !`;
        break;
      default:
        message = '✓ Achat effectué !';
    }

    const embed = new EmbedBuilder()
      .setTitle('🛒 Achat réussi')
      .setDescription(message + `\n💰 Nouveau solde : **${cookies[userId]}** cookies`)
      .setColor('#00cc66');

    await interaction.reply({ embeds: [embed] });
  }
};

function savePowerup(userId, powerupId) {
  const p = fs.existsSync(POWERUPS_PATH)
    ? JSON.parse(fs.readFileSync(POWERUPS_PATH))
    : {};
  if (!p[userId]) p[userId] = [];
  if (!p[userId].includes(powerupId)) {
    p[userId].push(powerupId);
    fs.writeFileSync(POWERUPS_PATH, JSON.stringify(p, null, 2));
  }
}
