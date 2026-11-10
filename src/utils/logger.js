/**
 * Logger กลาง ใช้ print log ลง console แบบมีสี/label ชัดเจน
 * และสามารถส่ง log สำคัญ (เช่น มีการเติมเงิน/ซื้อของ) เข้าห้อง Discord ได้
 */

function info(tag, message) {
  console.log(`\x1b[36m[${tag}]\x1b[0m ${message}`);
}

function success(tag, message) {
  console.log(`\x1b[32m[${tag}]\x1b[0m ${message}`);
}

function warn(tag, message) {
  console.warn(`\x1b[33m[${tag}]\x1b[0m ${message}`);
}

function error(tag, message) {
  console.error(`\x1b[31m[${tag}]\x1b[0m ${message}`);
}

/**
 * ส่ง Embed log เข้าห้องที่กำหนดใน .env (LOG_CHANNEL_ID)
 * ใช้สำหรับแจ้งเตือนแอดมินเวลามีธุรกรรมเกิดขึ้น
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').EmbedBuilder} embed
 */
async function sendLogEmbed(client, embed) {
  const channelId = process.env.LOG_CHANNEL_ID;
  if (!channelId) return; // ถ้าไม่ตั้งค่าไว้ ก็ข้ามไปเงียบ ๆ

  try {
    const channel = await client.channels.fetch(channelId);
    if (channel) await channel.send({ embeds: [embed] });
  } catch (err) {
    error('Logger', `ส่ง log เข้าห้องไม่สำเร็จ: ${err.message}`);
  }
}

module.exports = { info, success, warn, error, sendLogEmbed };
