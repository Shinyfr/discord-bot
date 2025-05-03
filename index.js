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

const COOKIE_COST    = 5;
const COOKIES_PATH   = path.join(__dirname, 'data/cookies.json');
const POWERUPS_PATH  = path.join(__dirname, 'data/powerups.json');

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

// ─── Messages texte ────────────────────────────────────
client.on('messageCreate', message => {
  if (message.author.bot) return;
  if (message.content === '!ping') {
    return message.reply('pong !');
  }
  if (message.content.toLowerCase().includes('cookie')) {
    return message.react('1230057572854272080');
  }
});

// ─── Interactions ──────────────────────────────────────
client.on('interactionCreate', async interaction => {
  // 1) Slash commands
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    try {
      await cmd.execute(interaction);
    } catch (err) {
      console.error(`Erreur /${interaction.commandName}`, err);
      return interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
    }
  }

  // 2) Machine à sous (bouton spin_)
  if (interaction.isButton() && interaction.customId.startsWith('spin_')) {
    const [ , userId ] = interaction.customId.split('_');
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: '❌ Ce n’est pas ta machine à sous !', ephemeral: true });
    }

    const cookiesData = fs.existsSync(COOKIES_PATH)
      ? JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'))
      : {};
    const current = cookiesData[userId] ?? 0;
    if (current < COOKIE_COST) {
      return interaction.reply({ content: '❌ Pas assez de cookies pour jouer !', ephemeral: true });
    }

    const weightedEmojis = [
      ...Array(11).fill('🍪'),
      ...Array(2).fill('🍫'),
      ...Array(2).fill('🍩'),
      ...Array(2).fill('🎁'),
      ...Array(3).fill('💣'),
    ];
    const spin = () => weightedEmojis[Math.floor(Math.random() * weightedEmojis.length)];
    const grid = [spin(), spin(), spin()];

    let gain = 0;
    if (grid[0] === grid[1] && grid[1] === grid[2]) {
      gain = 20;
    }

    const newBalance = current - COOKIE_COST + gain;
    cookiesData[userId] = newBalance;
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookiesData, null, 2));

    const resultEmbed = new EmbedBuilder()
      .setTitle('🎰 Résultat de la machine à cookies')
      .setDescription(
        `${grid.join(' | ')}\n\n` +
        (gain > 0
          ? `🎉 Bravo ! Tu gagnes **${gain}** cookies !`
          : '😢 Pas de chance cette fois...'
        ) +
        `\n\n💰 Solde : **${newBalance}** cookies`
      )
      .setColor(gain > 0 ? '#00cc66' : '#cc0000');

    return interaction.reply({ embeds: [resultEmbed] });
  }

  // 3) Boutique (/shop) via dropdown
  if (
    interaction.type === InteractionType.MessageComponent &&
    interaction.isStringSelectMenu() &&
    interaction.customId === 'shop_select'
  ) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const shop = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/shop.json'), 'utf-8'));
      const itemId = interaction.values[0];
      const item = shop.find(i => i.id === itemId);
      if (!item) throw new Error('Item introuvable.');

      const cookies = fs.existsSync(COOKIES_PATH)
        ? JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'))
        : {};
      const powerups = fs.existsSync(POWERUPS_PATH)
        ? JSON.parse(fs.readFileSync(POWERUPS_PATH, 'utf-8'))
        : {};
      const uid = interaction.user.id;
      const balance = cookies[uid] ?? 0;

      if (balance < item.price) {
        return interaction.editReply({ content: '❌ Solde insuffisant.', ephemeral: true });
      }

      cookies[uid] = balance - item.price;
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
          if (!powerups[uid]) powerups[uid] = [];
          powerups[uid].push(item.permission);
          fs.writeFileSync(POWERUPS_PATH, JSON.stringify(powerups, null, 2));
          msg = `✅ Tu peux désormais utiliser **/${item.permission}** !`;
          break;

        case 'mystery':
          const gainMyst = Math.floor(Math.random() * 101);
          cookies[uid] += gainMyst;
          msg = `🎁 Mystery Box : tu obtiens **${gainMyst}** cookies !`;
          break;

        default:
          msg = '✓ Achat effectué !';
      }

      fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));

      const embed = new EmbedBuilder()
        .setTitle('🛒 Achat réussi')
        .setDescription(`${msg}\n💰 Nouveau solde : **${cookies[uid]}** cookies`)
        .setColor('#00cc66');
      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('Erreur shop_select:', err);
      const noPerm = err.code === 50013;
      return interaction.editReply({
        content: noPerm
          ? '❌ Je n’ai pas la permission d’ajouter ce rôle. Vérifie la hiérarchie et la permission **Manage Roles**.'
          : `❌ Erreur : ${err.message}`,
        ephemeral: true
      });
    }
  }
  
  // 4) Blackjack – boutons “hit_…” et “stay_…”
  if (interaction.isButton()) {
    const id = interaction.customId;

    // Hit
    if (id.startsWith('hit_')) {
      const [ , userId, mise, ...rest ] = id.split('_');
      const player = rest.slice(0, -2).map(n => parseInt(n, 10));
      const bot    = rest.slice(-2).map(n => parseInt(n, 10));
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
        new ButtonBuilder()
          .setCustomId(`hit_${userId}_${mise}_${player.join('_')}_${bot.join('_')}`)
          .setLabel('🃙 Tirer')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`stay_${userId}_${mise}_${player.join('_')}_${bot.join('_')}`)
          .setLabel('🛑 Rester')
          .setStyle(ButtonStyle.Secondary)
      );

      const embed = new EmbedBuilder()
        .setTitle('🃏 Blackjack')
        .setDescription(
          `Tes cartes : **${player.join(', ')}** (total: ${total})\n` +
          `Cartes du bot : **?** et **?**\n` +
          `🎰 Mise : ${mise} cookies`
        )
        .setColor('#5865f2');

      return interaction.update({ embeds: [embed], components: [row] });
    }

    // Stay
    if (id.startsWith('stay_')) {
      const [ , userId, mise, ...rest ] = id.split('_');
      const player = rest.slice(0, -2).map(n => parseInt(n, 10));
      const bot    = rest.slice(-2).map(n => parseInt(n, 10));

      while (bot.reduce((a,b) => a + b, 0) < 17) {
        bot.push(Math.floor(Math.random() * 10) + 2);
      }

      const totalP = player.reduce((a,b) => a + b, 0);
      const totalB = bot.reduce((a,b) => a + b, 0);
      const bet    = parseInt(mise, 10);
      let result = '';
      let net    = 0;

      if (totalP > 21) {
        result = '💥 Tu as dépassé 21. Tu perds.';
        net = 0;
      } else if (totalB > 21 || totalP > totalB) {
        result = `🎉 Tu gagnes ${bet} cookies !`;
        net = bet * 2;
      } else if (totalP === totalB) {
        result = '🤝 Égalité, tu récupères ta mise.';
        net = bet;
      } else {
        result = `😢 Le bot a gagné. Tu perds ${bet} cookies.`;
        net = 0;
      }

      const cookiesPath = COOKIES_PATH;
      const cookiesData = fs.existsSync(cookiesPath)
        ? JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'))
        : {};
      const current = cookiesData[userId] ?? 0;
      cookiesData[userId] = current + net;
      fs.writeFileSync(cookiesPath, JSON.stringify(cookiesData, null, 2));

      const embed = new EmbedBuilder()
        .setTitle('🎲 Résultat du Blackjack')
        .setDescription(
          `🧍 Toi : ${player.join(', ')} = **${totalP}**\n` +
          `🤖 Bot : ${bot.join(', ')} = **${totalB}**\n\n` +
          `${result}\n\n` +
          `💰 Solde : **${cookiesData[userId]}** cookies`
        )
        .setColor('#3333cc');

      return interaction.update({ embeds: [embed], components: [] });
    }
  }
});

client.login(process.env.TOKEN);
