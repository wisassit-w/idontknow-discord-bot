const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ชี้หาไฟล์ .env ที่อยู่ด้านนอกสุด (Root)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const commands = [];
// ถอยออกจาก scripts (..) แล้วเข้าโฟลเดอร์ commands
const commandsPath = path.join(__dirname, '..', 'commands');

// กวาดอ่านไฟล์คำสั่งทั้งหมดในโฟลเดอร์ commands
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[คำเตือน] ไฟล์ ${file} ขาด data หรือ execute`);
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`กำลังรีเฟรช Slash Commands ทั้งหมด ${commands.length} คำสั่ง...`);

    // ลงทะเบียนคำสั่งเข้า Guild โดยตรง (แสดงผลทันที ไม่ต้องรอคิวระดับ Global)
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ ลงทะเบียน Slash Commands สำเร็จเรียบร้อย!');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการลงทะเบียนคำสั่ง:', error);
  }
})();