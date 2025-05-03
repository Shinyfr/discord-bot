const { Client, GatewayIntentBits, Collection, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

// Chargement des commandes slash
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[AVERTISSEMENT] La commande à ${filePath} est invalide.`);
    }
  }
}

// Message quand le bot est prêt
client.once('ready', () => {
  console.log(`Bot en ligne : ${client.user.tag}`);
});

// Commandes texte
client.on('messageCreate', message => {
  if (message.author.bot) return;

  if (message.content === '!ping') {
    message.reply('pong !');
  }

  if (message.content.toLowerCase().includes('cookie')) {
    message.react('1230057572854272080'); // ID de l'emoji
  }
});

// Gestion des interactions slash + boutons
client.on('interactionCreate', async interaction => {
  // Commandes slash
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
      }
    }
    return;
  }

  // Boutons (machine à sous)
  if (interaction.isButton()) {
    const userId = interaction.user.id;
    const buttonId = interaction.customId;

    if (buttonId === `spin_${userId}`) {
      const emojis = ['🍪', '🍫', '🍩', '💣', '🎁'];
      const spin = () => emojis[Math.floor(Math.random() * emojis.length)];
      const grid = [spin(), spin(), spin()];
      const cookiesPath = './data/cookies.json';
      const cookies = JSON.parse(fs.readFileSync(cookiesPath));
      const current = cookies[userId] ?? 20;

      if (current < 5) {
        return interaction.reply({ content: "❌ Pas assez de cookies !", ephemeral: true });
      }

      let gain = 0;
      if (grid[0] === grid[1] && grid[1] === grid[2]) {
        gain = 20;
      }

      const newBalance = current - 5 + gain;
      cookies[userId] = newBalance;
      fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));

      const resultEmbed = new EmbedBuilder()
        .setTitle("🎰 Résultat du spin")
        .setDescription(`${grid.join(' | ')}\n\n${gain > 0 ? `🎉 Bravo ! Tu gagnes ${gain} cookies !` : '😢 Pas de chance cette fois...'}\n\n💰 Solde : ${newBalance} cookies`)
        .setColor(gain > 0 ? '#00cc66' : '#cc0000');

      await interaction.reply({ embeds: [resultEmbed], ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
