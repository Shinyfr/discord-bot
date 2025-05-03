const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

// Lecture des commandes
client.commands = new Map();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(path.join(foldersPath, folder)).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(foldersPath, folder, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    }
  }
}

client.once('ready', () => {
  console.log(`Bot en ligne : ${client.user.tag}`);
});

// Commandes blackjack et gestion de l'interaction
client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    const customId = interaction.customId;

    // Blackjack - Tirer une carte
    if (customId.startsWith('hit_')) {
      const [_, userId, mise, ...cartes] = customId.split('_');
      const joueur = cartes.slice(0, -2).map(n => parseInt(n));
      const bot = cartes.slice(-2).map(n => parseInt(n));

      // Si l'utilisateur essaie de tricher
      if (interaction.user.id !== userId) {
        return interaction.reply({ content: "❌ Ce n’est pas ta partie.", ephemeral: true });
      }

      // Tirer une carte pour le joueur
      const nouvelleCarte = Math.floor(Math.random() * 10) + 2;
      joueur.push(nouvelleCarte);
      const totalJoueur = joueur.reduce((acc, card) => acc + card, 0);

      if (totalJoueur > 21) {
        const embed = new EmbedBuilder()
          .setTitle('💥 Perdu !')
          .setDescription(`Tu as tiré **${nouvelleCarte}** et dépassé 21.\n🃙 Tes cartes : ${joueur.join(', ')} (total: ${totalJoueur})`)
          .setColor('#cc0000');

        return interaction.update({ embeds: [embed], components: [] });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`hit_${userId}_${mise}_${joueur.join('_')}_${bot.join('_')}`).setLabel('🃙 Tirer').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`stay_${userId}_${mise}_${joueur.join('_')}_${bot.join('_')}`).setLabel('🛑 Rester').setStyle(ButtonStyle.Secondary)
      );

      const embed = new EmbedBuilder()
        .setTitle('🃏 Blackjack')
        .setDescription(`Tes cartes : **${joueur.join(', ')}** (total: ${totalJoueur})\nCartes du bot : **?** et **?**\n\n🎰 Mise : ${mise} cookies`)
        .setColor('#5865f2');

      return interaction.update({ embeds: [embed], components: [row] });
    }

    // Blackjack - Rester
    if (customId.startsWith('stay_')) {
      const [_, userId, mise, ...cartes] = customId.split('_');
      const joueur = cartes.slice(0, -2).map(n => parseInt(n));
      const bot = cartes.slice(-2).map(n => parseInt(n));

      // Jouer automatiquement pour le bot
      while (bot.reduce((acc, card) => acc + card, 0) < 17) {
        bot.push(Math.floor(Math.random() * 10) + 2);
      }

      const totalJoueur = joueur.reduce((acc, card) => acc + card, 0);
      const totalBot = bot.reduce((acc, card) => acc + card, 0);

      let resultat = '';
      let gain = 0;

      const cookies = JSON.parse(fs.readFileSync('./data/cookies.json'));
      const current = cookies[userId] ?? 0;

      // Vérifier que le joueur a assez de cookies pour parier
      if (current < mise) {
        return interaction.reply({ content: "❌ Tu n'as pas assez de cookies pour cette mise !", ephemeral: true });
      }

      // Logique de gains et de pertes
      if (totalJoueur > 21) {
        resultat = '💥 Tu as dépassé 21. Tu perds.';
        gain = 0;
      } else if (totalBot > 21 || totalJoueur > totalBot) {
        resultat = `🎉 Tu gagnes ${mise * 2} cookies !`;
        gain = mise * 2;
      } else if (totalJoueur === totalBot) {
        resultat = '🤝 Égalité, tu récupères ta mise.';
        gain = mise; // Retour de la mise en cas d'égalité
      } else {
        resultat = '😢 Le bot a gagné. Tu perds ta mise.';
        gain = 0;
      }

      cookies[userId] = current + (gain - mise); // Mise à jour du solde
      fs.writeFileSync('./data/cookies.json', JSON.stringify(cookies, null, 2));

      const embed = new EmbedBuilder()
        .setTitle('🎲 Résultat du Blackjack')
        .setDescription(
          `🧍 Toi : ${joueur.join(', ')} = **${totalJoueur}**\n🤖 Bot : ${bot.join(', ')} = **${totalBot}**\n\n${resultat}`
        )
        .setColor('#3333cc');

      return interaction.update({ embeds: [embed], components: [] });
    }
  }
});

// Connexion au bot Discord
client.login(process.env.TOKEN);
