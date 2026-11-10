require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const logger = require('./utils/logger');

// ================================
// 1) สร้าง Discord Client
// ================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers, // จำเป็นสำหรับตรวจจับสมาชิกเข้าใหม่
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.commands = new Collection();

// ================================
// 2) โหลด Slash Commands
// ================================
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
  logger.info('Loader', `โหลดคำสั่ง /${command.data.name} สำเร็จ`);
}

// ================================
// 3) โหลด Events ทั้งหมดจากโฟลเดอร์ events/
// ================================
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }

  logger.info('Loader', `โหลด event ${event.name} สำเร็จ`);
}

// ================================
// 4) ดักจับ error
// ================================
process.on('unhandledRejection', (error) => {
  logger.error('Process', `Unhandled promise rejection: ${error.stack || error}`);
});

// ================================
// 5) Login เข้าสู่ระบบ Discord
// ================================
client.login(process.env.DISCORD_TOKEN);