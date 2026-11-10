require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { deliverInternetNiran } = require('./services/orderDeliveryService');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', async () => {
  console.log(`[TEST] ล็อกอินสำเร็จ: ${client.user.tag}`);

  // 1. ดึงข้อมูลเซิร์ฟเวอร์
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  
  // 2. ดึงข้อมูลตัวคุณเองมาเป็นลูกค้าทดสอบ (ดึงตาม Owner ID ของเซิร์ฟเวอร์)
  const member = await guild.members.fetch(guild.ownerId);

  console.log(`⏳ กำลังจำลองการส่งมอบคีย์ให้: ${member.user.tag}...`);

  // 3. รันคำสั่งส่งมอบสินค้า
  const ticketChannel = await deliverInternetNiran(guild, member);

  console.log(`✅ เทสสำเร็จ! บอทสร้างห้องตั๋วแล้วที่: #${ticketChannel.name}`);
  process.exit();
});

client.login(process.env.DISCORD_TOKEN);