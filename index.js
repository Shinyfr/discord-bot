// index.js
const {
  Client,
  GatewayIntentBits,
  Collection,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  InteractionType
} = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// ─── Chargement des commandes slash ────────────────────
const commandsPath = path.join(__dirname, 'commands');
for (const folder of fs.readdirSync(commandsPath)) {
  const folderPath = path.join(commandsPath, folder);
  for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))) {
    const command = require(path.join(folderPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
}

client.once('ready', () => {
  console.log(`Bot en ligne : ${client.user.tag}`);
});

// ─── Gestion des messages texte ────────────────────────
client.on('messageCreate', message => {
  if (message.author.bot) return;
  if (message.content === '!ping') {
    return message.reply('pong !');
  }
  if (message.content.toLowerCase().includes('cookie')) {
    return message.react('1230057572854272080');
  }
});

// ─── Gestion des interactions ──────────────────────────
client.on('interactionCreate', async interaction => {
  // 1) Slash commands
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    try {
      await cmd.execute(interaction);
    } catch (error) {
      console.error(`Erreur /${interaction.commandName}`, error);
      return interaction.reply({ content: `❌ Erreur : ${error.message}`, ephemeral: true });
    }
  }

  // 2) Achat via menu déroulant (/shop)
  if (
    interaction.type === InteractionType.MessageComponent &&
    interaction.isStringSelectMenu() &&
    interaction.customId === 'shop_select'
  ) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const shop = JSON.parse(fs.readFileSync('./data/shop.json', 'utf-8'));
      const itemId = interaction.values[0];
      const item = shop.find(i => i.id === itemId);
      if (!item) throw new Error('Item introuvable.');

      // Lecture du solde
      const cookiesPath = './data/cookies.json';
      const cookies = fs.existsSync(cookiesPath)
        ? JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'))
        : {};
      const uid = interaction.user.id;
      const balance = cookies[uid] ?? 0;
      if (balance < item.price) {
        return interaction.editReply({ content: '❌ Solde insuffisant.', ephemeral: true });
      }

      // Débite le coût
      cookies[uid] = balance - item.price;
      fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));

      // Fonction utilitaire pour powerups
      const savePowerup = (userId, powerupId) => {
        const puPath = './data/powerups.json';
        const pu = fs.existsSync(puPath) ? JSON.parse(fs.readFileSync(puPath)) : {};
        if (!pu[userId]) pu[userId] = [];
        if (!pu[userId].includes(powerupId)) {
          pu[userId].push(powerupId);
          fs.writeFileSync(puPath, JSON.stringify(pu, null, 2));
        }
      };

      // Application de la récompense
      let msg;
      switch (item.type) {
        case 'role':
          await interaction.member.roles.add(item.roleId);
          msg = `✅ Tu as reçu le rôle **${item.name}** !`;
          break;
        case 'emoji':
          msg = `✅ Tu as acheté **${item.name}** !\n👉 Envoie-moi maintenant l’emoji que tu souhaites ajouter au serveur.`;
          break;
        case 'permission':
          savePowerup(uid, item.id);
          msg = `✅ Tu peux désormais utiliser la commande **/${item.permission}** !`;
          break;
        case 'mystery':
          const gain = Math.floor(Math.random() * 101);
          cookies[uid] += gain;
          fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
          msg = `🎁 Mystery Box : tu obtiens **${gain}** cookies !`;
          break;
        case 'multiplier':
        case 'passive':
          savePowerup(uid, item.id);
          msg = `✅ Item **${item.name}** ajouté à tes power-ups !`;
          break;
        default:
          msg = '✓ Achat effectué !';
      }

      const embed = new EmbedBuilder()
        .setTitle('🛒 Achat réussi')
        .setDescription(`${msg}\n💰 Nouveau solde : **${cookies[uid]}** cookies`)
        .setColor('#00cc66');

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur achat shop_select:', error);
      const noPerm = error.code === 50013;
      return interaction.editReply({
        content: noPerm
          ? '❌ Je n’ai pas la permission d’ajouter ce rôle. Vérifie la hiérarchie et la permission **Manage Roles**.'
          : `❌ Une erreur est survenue : ${error.message}`,
        ephemeral: true
      });
    }
  }

  // 3) Blackjack – boutons “hit_…” et “stay_…”
  if (interaction.isButton()) {
    const id = interaction.customId;

    // Tirer une carte
    if (id.startsWith('hit_')) {
      const [ , userId, mise, ...rest ] = id.split('_');
      const player = rest.slice(0, -2).map(n => parseInt(n));
      const bot = rest.slice(-2).map(n => parseInt(n));

      if (interaction.user.id !== userId) {
        return interaction.reply({ content: "❌ Ce n’est pas ta partie.", ephemeral: true });
      }

      const card = Math.floor(Math.random() * 10) + 2;
      player.push(card);
      const total = player.reduce((a,b) => a + b, 0);

      if (total > 21) {
        const embed = new EmbedBuilder()
          .setTitle('💥 Perdu !')
          .setDescription(`Tu as tiré **${card}** et dépassé 21.\n🃙 Tes cartes : ${player.join(', ')} (total: ${total})`)
          .setColor('#cc0000');
        return interaction.update({ embeds: [embed], components: [] });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`hit_${userId}_${mise}_${player.join('_')}_${bot.join('_')}`).setLabel('🃙 Tirer').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`stay_${userId}_${mise}_${player.join('_')}_${bot.join('_')}`).setLabel('🛑 Rester').setStyle(ButtonStyle.Secondary)
      );

      const embed = new EmbedBuilder()
        .setTitle('🃏 Blackjack')
        .setDescription(`Tes cartes : **${player.join(', ')}** (total: ${total})\nCartes du bot : **?** et **?**\n🎰 Mise : ${mise}`)
        .setColor('#5865f2');
      return interaction.update({ embeds: [embed], components: [row] });
    }

    // Rester
    if (id.startsWith('stay_')) {
      const [ , userId, mise, ...rest ] = id.split('_');
      const player = rest.slice(0, -2).map(n => parseInt(n));
      const bot = rest.slice(-2).map(n => parseInt(n));

      while (bot.reduce((a,b) => a + b, 0) < 17) {
        bot.push(Math.floor(Math.random() * 10) + 2);
      }

      const totalP = player.reduce((a,b) => a + b, 0);
      const totalB = bot.reduce((a,b) => a + b, 0);
      let result = '';
      let gain = 0;

      if (totalP > 21) {
        result = '💥 Tu as dépassé 21. Tu perds.';
      } else if (totalB > 21 || totalP > totalB) {
        result = `🎉 Tu gagnes ${mise * 2} cookies !`;
        gain = mise * 2;
      } else if (totalP === totalB) {
        result = '🤝 Égalité, tu récupères ta mise.';
        gain = mise;
      } else {
        result = '😢 Le bot a gagné. Tu perds ta mise.';
      }

      // Met à jour le solde
      const cookiesPath = './data/cookies.json';
      const cookies = fs.existsSync(cookiesPath) ? JSON.parse(fs.readFileSync(cookiesPath)) : {};
      const current = cookies[userId] ?? 0;
      cookies[userId] = current + (gain - parseInt(mise));
      fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));

      const embed = new EmbedBuilder()
        .setTitle('🎲 Résultat du Blackjack')
        .setDescription(
          `🧍 Toi : ${player.join(', ')} = **${totalP}**\n🤖 Bot : ${bot.join(', ')} = **${totalB}**\n\n${result}`
        )
        .setColor('#3333cc');

      return interaction.update({ embeds: [embed], components: [] });
    }
  }
});

client.login(process.env.TOKEN);
