const { EmbedBuilder } = require('discord.js');

/**
 * ส่งการ์ดแจ้งเตือนออเดอร์ใหม่เข้าห้องสาธารณะ
 * @param {import('discord.js').Guild} guild 
 * @param {import('discord.js').User} user 
 * @param {string} productName 
 * @param {number} price 
 */
async function sendOrderFeed(guild, user, productName, price) {
  const feedChannelId = process.env.ORDER_FEED_CHANNEL_ID;
  if (!feedChannelId) return;

  try {
    const channel = guild.channels.cache.get(feedChannelId) || 
                    await guild.channels.fetch(feedChannelId).catch(() => null);

    if (!channel) return;

    const feedEmbed = new EmbedBuilder()
      .setColor(0x050505)
      .setAuthor({ 
        name: '✦  IDONTKNOW STORE ・ NEW PURCHASE', 
        iconURL: guild.iconURL({ dynamic: true }) || undefined
      })
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
        `🎉 ขอขอบคุณ **<@${user.id}>** ที่เลือกใช้บริการ!\n\n` +
        '╭─── ✦ **รายละเอียดคำสั่งซื้อ**\n' +
        `│ ✦ สินค้า : **${productName}**\n` +
        `│ ✦ ยอดชำระ : \`${price.toLocaleString()} บาท\`\n` +
        `│ ✦ สถานะ : \`ชำระเงินสำเร็จ (Delivered)\`\n` +
        '╰───────────────────────────────\n\n' +
        '✧ ขอบคุณที่ไว้วางใจ IDONTKNOW STORE 🖤\n\n' +
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦'
      )
      .setFooter({ text: 'Automated Order Verification System' })
      .setTimestamp();

    await channel.send({ embeds: [feedEmbed] });
  } catch (error) {
    console.error('[Order Feed Error]:', error);
  }
}

module.exports = { sendOrderFeed };