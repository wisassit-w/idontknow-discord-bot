const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const userMessageMap = new Map();
const LIMIT_MESSAGES = 5;       // พิมพ์เกิน 5 ข้อความ
const TIME_WINDOW_MS = 4000;    // ภายใน 4 วินาที
const MAX_MENTIONS = 4;         // หรือแท็กเกิน 4 ครั้ง

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    // ข้ามเจ้าของเซิร์ฟเวอร์
    if (message.author.id === message.guild.ownerId) return;

    const { author, channel, guild, member } = message;
    const now = Date.now();

    // 1. ตรวจสอบ Mass Mention (แท็กคนเยอะผิดปกติ หรือแท็ก @everyone)
    const mentionsCount = message.mentions.users.size + message.mentions.roles.size;
    const hasMassMention = mentionsCount >= MAX_MENTIONS || message.content.includes('@everyone') || message.content.includes('@here');

    if (hasMassMention && !member.permissions.has(PermissionFlagsBits.MentionEveryone)) {
      try {
        await message.delete();
        await member.timeout(60 * 60 * 1000, 'Anti-Raid: พยายามสแปมแท็กข้อความ');

        const alertEmbed = new EmbedBuilder()
          .setColor(0x050505)
          .setTitle('🛡️ IDONTKNOW — SECURITY SYSTEM')
          .setDescription(
            `ระงับการใช้งาน ${author} ชั่วคราว (1 ชั่วโมง)\n` +
            '› สาเหตุ: **สแปมแท็กคน/แท็กห้องในเซิร์ฟเวอร์**'
          )
          .setFooter({ text: 'IDONTKNOW Security Service' });

        await channel.send({ embeds: [alertEmbed] });
        return;
      } catch (err) {
        console.error('Anti-Spam Mention Error:', err);
      }
    }

    // 2. ตรวจสอบการส่งข้อความรัวผิดธรรมชาติ (Flood Spam)
    if (!userMessageMap.has(author.id)) {
      userMessageMap.set(author.id, []);
    }

    const timestamps = userMessageMap.get(author.id);
    timestamps.push(now);

    const recentMessages = timestamps.filter((t) => now - t < TIME_WINDOW_MS);
    userMessageMap.set(author.id, recentMessages);

    if (recentMessages.length >= LIMIT_MESSAGES) {
      userMessageMap.delete(author.id);

      try {
        await message.delete();
        await member.timeout(15 * 60 * 1000, 'Anti-Spam: ส่งข้อความเร็วกว่าปกติ');

        const spamEmbed = new EmbedBuilder()
          .setColor(0x050505)
          .setTitle('🛡️ IDONTKNOW — SECURITY SYSTEM')
          .setDescription(
            `ตรวจพบพฤติกรรมสแปมข้อความจาก ${author}\n` +
            '› การลงโทษ: **ใบ้ชั่วคราว (Timeout) 15 นาที**\n' +
            '› สาเหตุ: ส่งข้อความเร็วกว่าปกติผิดธรรมชาติ'
          )
          .setFooter({ text: 'IDONTKNOW Security Service' });

        await channel.send({ embeds: [spamEmbed] });

        // แจ้งเตือนลงห้อง LOG
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (logChannelId) {
          const logChannel = guild.channels.cache.get(logChannelId);
          if (logChannel) {
            await logChannel.send({
              content: `🚨 **[SECURITY ALERT]** สมาชิก ${author} (\`${author.id}\`) ถูกระงับชั่วคราวเนื่องจากสแปมห้อง <#${channel.id}>`,
            });
          }
        }
      } catch (err) {
        console.error('Failed to timeout member:', err);
      }
    }
  },
};