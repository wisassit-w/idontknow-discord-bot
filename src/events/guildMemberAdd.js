const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    if (!welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) return;

    const verifyChannelId = process.env.VERIFY_CHANNEL_ID;

    const embed = new EmbedBuilder()
      .setColor(0x050505)
      .setTitle('IDONTKNOW — WELCOME')
      .setDescription(
        '⋆ ₊ **ยินดีต้อนรับสู่ IDONTKNOW**\n\n' +
        `ยินดีต้อนรับ ${member} สู่เซิร์ฟเวอร์!\n` +
        'ศูนย์รวม Reshade Preset • FiveM Setting\n\n' +
        (verifyChannelId ? `> ⋆ กดรับยศได้ที่: <#${verifyChannelId}>\n` : '') +
        '> ⋆ ติดต่อสั่งซื้อหรือสอบถามผ่านระบบ Ticket เท่านั้น'
      )
      .setImage('https://images-ext-1.discordapp.net/external/dEMO3yPs5FZtpxGiPGN97q82iWzerzVzuvIEA7ffcmM/https/i.pinimg.com/originals/0a/d7/35/0ad735f722522d9a424b2a018ff63319.gif')
      .setFooter({ text: 'IDONTKNOW OFFICIAL • Est. 2026' })
      .setTimestamp();

    await channel.send({
      content: `welcome ${member} ⋆ ₊`,
      embeds: [embed],
    });
  },
};