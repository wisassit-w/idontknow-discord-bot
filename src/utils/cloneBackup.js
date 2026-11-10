require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', async () => {
  console.log(`[CLONER] ล็อกอินสำเร็จ: ${client.user.tag}`);
  const guild = await client.guilds.fetch(process.env.GUILD_ID);

  console.log(`กำลังดึงข้อมูลโครงสร้างจาก: ${guild.name}...`);

  // ดึง Roles ทั้งหมดยกเว้นยศบอทและ @everyone
  const roles = guild.roles.cache
    .filter((r) => !r.managed && r.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .map((r) => ({
      name: r.name,
      color: r.color,
      hoist: r.hoist,
      permissions: r.permissions.bitfield.toString(),
      mentionable: r.mentionable,
    }));

  // ดึง Categories และ Channels ย่อย
  const structure = [];
  const categories = guild.channels.cache
    .filter((c) => c.type === 4)
    .sort((a, b) => a.position - b.position);

  for (const [, cat] of categories) {
    const children = guild.channels.cache
      .filter((c) => c.parentId === cat.id)
      .sort((a, b) => a.position - b.position)
      .map((c) => ({
        name: c.name,
        type: c.type,
        topic: c.topic || null,
        nsfw: c.nsfw || false,
      }));

    structure.push({
      name: cat.name,
      type: cat.type,
      children,
    });
  }

  const backupData = {
    guildName: guild.name,
    roles,
    structure,
  };

  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const backupPath = path.join(dataDir, 'server_backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

  console.log(`✅ ดูดโครงสร้างดิสเรียบร้อย! บันทึกที่: data/server_backup.json`);
  process.exit();
});

client.login(process.env.DISCORD_TOKEN);