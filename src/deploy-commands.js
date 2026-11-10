const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] ไฟล์ ${filePath} ไม่มี data หรือ execute`);
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`กำลังรีเฟรช Slash Commands ทั้งหมด ${commands.length} คำสั่ง...`);

        // ถ้าใน .env มี GUILD_ID จะลงแบบทันทีในเซิร์ฟเวอร์ ถ้าไม่มีจะลงแบบ Global
        if (process.env.GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log('✅ ลงทะเบียน Slash Commands ในเซิร์ฟเวอร์เรียบร้อย!');
        } else {
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log('✅ ลงทะเบียน Slash Commands แบบ Global เรียบร้อย!');
        }
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการ Deploy:', error);
    }
})();