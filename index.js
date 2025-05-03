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
    message.react('🍪'); // Peut être remplacé par un ID personnalisé si emoji custom
  }
});

client.login(process.env.TOKEN);
