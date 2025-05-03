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
const foldersPath = path.join(__dirname, 'commands');
for (const folder of fs.readdirSync(foldersPath)) {
  const commandsPath = path.join(foldersPath, folder);
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
}

client.once('ready', () => {
  console.log(`Bot en ligne : ${client.user.tag}`);
});

// ─── Gestion messages texte ────────────────────────────
client.on('messageCreate', message => {
  if (message.author.bot) return;
  if (message.content === '!ping') message.reply('pong !');
  if (message.content.toLowerCase().includes('cookie')) {
    message.react('1230057572854272080');
  }
});

// ─── Gestion des interactions ──────────────────────────
client.on('interactionCreate', async interaction => {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    try {
      await cmd.execute(interaction);
    } catch (err) {
      console.error(`Erreur /${interaction.commandName}`, err);
      await interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
    }
  }

  // Achat via menu déroulant
  if (
    interaction.type === InteractionType.MessageComponent &&
    interaction.isStringSelectMenu() &&
    interaction.customId === 'shop_select'
  ) {
    await interaction.deferReply({ ephemeral: true });

    // Charge shop
    const shop = JSON.parse(fs.readFileSync('./data/shop.json', 'utf-8'));
    const itemId = interaction.values[0];
    const item = shop.find(i => i.id === itemId);
    if (!item) {
      return interaction.editReply({ content: '❌ Item introuvable.', ephemeral: true });
    }

    // Charge cookies
    const cookiesPath = './data/cookies.json';
    const cookies = fs.existsSync(cookiesPath)
      ? JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'))
      : {};
    const userId = interaction.user.id;
    const balance = cookies[userId] ?? 0;

    if (balance < item.price) {
      return interaction.editReply({ content: '❌ Solde insuffisant.', ephemeral: true });
    }

    // Débite
    cookies[userId] = balance - item.price;
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));

    // Helper pour powerups
    const savePowerup = (uid, pid) => {
      const puPath = './data/powerups.json';
      const pu = fs.existsSync(puPath) ? JSON.parse(fs.readFileSync(puPath)) : {};
      if (!pu[uid]) pu[uid] = [];
      if (!pu[uid].includes(pid)) {
        pu[uid].push(pid);
        fs.writeFileSync(puPath, JSON.stringify(pu, null, 2));
      }
    };

    // Applique récompense
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
        savePowerup(userId, item.id);
        msg = `✅ Tu peux désormais utiliser la commande **/${item.permission}** !`;
        break;
      case 'mystery':
        const gain = Math.floor(Math.random() * 101);
        cookies[userId] += gain;
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
        msg = `🎁 Mystery Box : tu obtiens **${gain}** cookies !`;
        break;
      case 'multiplier':
      case 'passive':
        savePowerup(userId, item.id);
        msg = `✅ Item **${item.name}** ajouté à tes power-ups !`;
        break;
      default:
        msg = '✓ Achat effectué !';
    }

    const embed = new EmbedBuilder()
      .setTitle('🛒 Achat réussi')
      .setDescription(`${msg}\n💰 Nouveau solde : **${cookies[userId]}** cookies`)
      .setColor('#00cc66');

    return interaction.editReply({ embeds: [embed] });
  }

  // (la gestion du blackjack et autres boutons reste inchangée ici…)
});

client.login(process.env.TOKEN);
