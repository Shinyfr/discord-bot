const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

// Chargement des commandes slash
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
    message.react('1230057572854272080'); // ID de ton emoji
  }
});

// Gestion des slash commands et boutons
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('Erreur dans /' + interaction.commandName, error);
      // Affiche la vraie erreur pour debug
      await interaction.reply({ content: `❌ Erreur : ${error.message}`, ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    const customId = interaction.customId;

    // 🃏 Blackjack – rester
    if (customId.startsWith('stay_')) {
      const [_, userId, mise, ...cartes] = customId.split('_');
      const joueur = cartes.slice(0, -2).map(n => parseInt(n));
      const bot = cartes.slice(-2).map(n => parseInt(n));

      while (bot.reduce((a, b) => a + b) < 17) {
        bot.push(Math.floor(Math.random() * 10) + 2);
      }

      const totalJoueur = joueur.reduce((a, b) => a + b);
      const totalBot = bot.reduce((a, b) => a + b);
      let resultat = '';
      let gain = 0;

      if (totalJoueur > 21) {
        resultat = '💥 Tu as dépassé 21. Tu perds.';
      } else if (totalBot > 21 || totalJoueur > totalBot) {
        resultat = `🎉 Tu gagnes ${mise * 2} cookies !`;
        gain = mise * 2;
      } else if (totalJoueur === totalBot) {
        resultat = '🤝 Égalité, tu récupères ta mise.';
        gain = mise;
      } else {
        resultat = '😢 Le bot a gagné. Tu perds ta mise.';
      }

      const cookies = JSON.parse(fs.readFileSync('./data/cookies.json'));
      cookies[userId] = (cookies[userId] ?? 0) + gain;
      fs.writeFileSync('./data/cookies.json', JSON.stringify(cookies, null, 2));

      const embed = new EmbedBuilder()
        .setTitle('🎲 Résultat du Blackjack')
        .setDescription(
          `🧍 Toi : ${joueur.join(', ')} = **${totalJoueur}**\n🤖 Bot : ${bot.join(', ')} = **${totalBot}**\n\n${resultat}`
        )
        .setColor('#3333cc');

      return interaction.update({ embeds: [embed], components: [] });
    }

    // 🃏 Blackjack – tirer
    if (customId.startsWith('hit_')) {
      const [_, userId, mise, ...rest] = customId.split('_');
      const joueur = rest.slice(0, -2).map(n => parseInt(n));
      const bot = rest.slice(-2).map(n => parseInt(n));

      if (interaction.user.id !== userId) {
        return interaction.reply({ content: "❌ Ce n’est pas ta partie.", ephemeral: true });
      }

      const nouvelle = Math.floor(Math.random() * 10) + 2;
      joueur.push(nouvelle);
      const total = joueur.reduce((a, b) => a + b);

      if (total > 21) {
        const embed = new EmbedBuilder()
          .setTitle('💥 Perdu !')
          .setDescription(`Tu as tiré **${nouvelle}** et dépassé 21.\n🃙 Tes cartes : ${joueur.join(', ')} (**${total}**)`)
          .setColor('#cc0000');

        return interaction.update({ embeds: [embed], components: [] });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`hit_${userId}_${mise}_${joueur.join('_')}_${bot.join('_')}`).setLabel('🃙 Tirer').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`stay_${userId}_${mise}_${joueur.join('_')}_${bot.join('_')}`).setLabel('🛑 Rester').setStyle(ButtonStyle.Secondary)
      );

      const embed = new EmbedBuilder()
        .setTitle('🃏 Blackjack')
        .setDescription(`Tes cartes : **${joueur.join(', ')}** (total: ${total})\nCartes du bot : **?** et **?**\n\n🎰 Mise : ${mise} cookies`)
        .setColor('#5865f2');

      return interaction.update({ embeds: [embed], components: [row] });
    }
  }
});

client.login(process.env.TOKEN);
