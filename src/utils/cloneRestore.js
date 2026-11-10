require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');

// 🔴 วาง ID เซิร์ฟเวอร์ใหม่ที่สร้างไว้ตรงนี้:
const TARGET_GUILD_ID = '1550423574882426950';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', async () => {
  console.log(`[CLONER] ล็อกอินสำเร็จ: ${client.user.tag}`);
  
  const targetGuild = await client.guilds.fetch(TARGET_GUILD_ID).catch(() => null);
  if (!targetGuild) {
    console.error('❌ ไม่พบเซิร์ฟเวอร์ปลายทาง ตรวจสอบว่าดึงบอทเข้าดิสใหม่หรือยัง');
    process.exit(1);
  }

  const backupPath = path.join(__dirname, '../../data/server_backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('❌ ไม่พบไฟล์ server_backup.json กรุณารัน cloneBackup.js ก่อน');
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  // 1. สร้างยศ
  console.log(`กำลังสร้างยศทั้งหมด (${backupData.roles.length} ยศ)...`);
  for (const roleData of backupData.roles) {
    try {
      await targetGuild.roles.create({
        name: roleData.name,
        color: roleData.color,
        hoist: roleData.hoist,
        mentionable: roleData.mentionable,
      });
      await sleep(1000); // ดีเลย์ป้องกัน Discord Rate Limit
    } catch (err) {
      console.error(`ข้ามยศ ${roleData.name}:`, err.message);
    }
  }

  // 2. สร้างหมวดหมู่และห้อง
  console.log(`กำลังสร้างหมวดหมู่และห้องทั้งหมด...`);
  for (const catData of backupData.structure) {
    try {
      const createdCategory = await targetGuild.channels.create({
        name: catData.name,
        type: catData.type,
      });
      await sleep(1000);

      for (const child of catData.children) {
        await targetGuild.channels.create({
          name: child.name,
          type: child.type,
          parent: createdCategory.id,
          topic: child.topic,
          nsfw: child.nsfw,
        });
        await sleep(1000);
      }
    } catch (err) {
      console.error(`ข้ามหมวด ${catData.name}:`, err.message);
    }
  }

  console.log('🎉 โคลนเซิร์ฟเวอร์เสร็จสมบูรณ์ 100%!');
  process.exit();
});

client.login(process.env.DISCORD_TOKEN);