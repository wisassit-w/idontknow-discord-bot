const { AuditLogEvent, EmbedBuilder } = require('discord.js');

// แคชเก็บบันทึกการกระทำที่อันตราย [userId]: [timestamps]
const actionTracker = new Map();
const MAX_ACTIONS = 2;          // ทำซ้ำเกิน 2 ครั้ง
const ACTION_WINDOW_MS = 10000; // ในเวลา 10 วินาที

async function checkAndPunish(guild, executor, reason) {
  if (!executor || executor.id === guild.ownerId || executor.id === guild.client.user.id) return;

  const now = Date.now();
  if (!actionTracker.has(executor.id)) {
    actionTracker.set(executor.id, []);
  }

  const timestamps = actionTracker.get(executor.id);
  timestamps.push(now);

  const recentActions = timestamps.filter((t) => now - t < ACTION_WINDOW_MS);
  actionTracker.set(executor.id, recentActions);

  if (recentActions.length >= MAX_ACTIONS) {
    actionTracker.delete(executor.id);

    try {
      const member = await guild.members.fetch(executor.id).catch(() => null);
      if (member) {
        // ถอดยศทั้งหมดออกเพื่อตัดสิทธิ์ทำลายเซิร์ฟเวอร์ทันที
        const manageableRoles = member.roles.cache.filter((r) => r.id !== guild.id && r.editable);
        await member.roles.remove(manageableRoles, 'Anti-Nuke: พยายามทำลายเซิร์ฟเวอร์');

        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (logChannelId) {
          const logChannel = guild.channels.cache.get(logChannelId);
          if (logChannel) {
            const alertEmbed = new EmbedBuilder()
              .setColor(0x050505)
              .setTitle('🚨 IDONTKNOW — ANTI-NUKE TRIGGERED')
              .setDescription(
                `**ตรวจพบการกระทำอันตรายต่อเซิร์ฟเวอร์!**\n\n` +
                `› ผู้กระทำ: ${executor} (\`${executor.id}\`)\n` +
                `› เหตุผล: **${reason}**\n` +
                `› การป้องกัน: **ปลดสิทธิ์ทุกยศของสมาชิกคนนี้ออกทันที**`
              )
              .setFooter({ text: 'IDONTKNOW Anti-Nuke System' })
              .setTimestamp();

            await logChannel.send({ content: `<@${guild.ownerId}> 🚨 ตรวจพบพฤติกรรมทำลายเซิร์ฟเวอร์!`, embeds: [alertEmbed] });
          }
        }
      }
    } catch (err) {
      console.error('Anti-Nuke Punish Error:', err);
    }
  }
}

module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    const { guild } = channel;
    if (!guild) return;

    try {
      const fetchedLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.ChannelDelete,
      });
      const firstEntry = fetchedLogs.entries.first();
      if (!firstEntry) return;

      const { executor } = firstEntry;
      await checkAndPunish(guild, executor, 'ลบห้องแชทในเซิร์ฟเวอร์ต่อเนื่อง');
    } catch (err) {
      console.error('Anti-Nuke Audit Fetch Error:', err);
    }
  },
};