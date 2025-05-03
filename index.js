const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.once('ready', () => {
  console.log(`Bot en ligne : ${client.user.tag}`);
});

client.on('messageCreate', message => {
  // Ignorer les messages du bot lui-même
  if (message.author.bot) return;

  // Répond "pong" si quelqu’un dit "!ping"
  if (message.content === '!ping') {
    message.reply('pong !');
  }

  // Réagit si le message contient "cookie" (insensible à la casse)
  if (message.content.toLowerCase().includes('cookie')) {
    message.react('1230057572854272080');
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    const userId = interaction.user.id;
    const buttonId = interaction.customId;

    if (buttonId === `spin_${userId}`) {
      const emojis = ['🍪', '🍫', '🍩', '💣', '🎁'];
      const spin = () => emojis[Math.floor(Math.random() * emojis.length)];

      const grid = [spin(), spin(), spin()];
      const path = './data/cookies.json';
      const cookies = JSON.parse(fs.readFileSync(path));
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
      fs.writeFileSync(path, JSON.stringify(cookies, null, 2));

      const resultEmbed = new EmbedBuilder()
        .setTitle("🎰 Résultat du spin")
        .setDescription(`${grid.join(' | ')}\n\n${gain > 0 ? `🎉 Bravo ! Tu gagnes ${gain} cookies !` : '😢 Pas de chance cette fois...'}\n\n💰 Solde : ${newBalance} cookies`)
        .setColor(gain > 0 ? '#00cc66' : '#cc0000');

      await interaction.reply({ embeds: [resultEmbed], ephemeral: true });
    }
  }
});


client.login(process.env.TOKEN);
