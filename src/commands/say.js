const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('สั่งให้บอทส่งข้อความตามที่กำหนด (เฉพาะแอดมิน)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('ข้อความที่ต้องการให้บอทส่ง (สามารถวางโค้ด Markdown ได้)')
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('เลือกห้องที่ต้องการให้ส่ง (หากไม่เลือกจะส่งในห้องนี้)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),

  async execute(interaction) {
    const messageContent = interaction.options.getString('message');
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      // ส่งข้อความผ่านบอทไปยังห้องเป้าหมาย
      await targetChannel.send({ content: messageContent });

      // แจ้งเตือนแอดมินแบบเห็นคนเดียว
      return interaction.reply({
        content: `✅ บอทส่งข้อความลงห้อง ${targetChannel} เรียบร้อยแล้ว!`,
        flags: [MessageFlags.Ephemeral],
      });
    } catch (error) {
      console.error('[Say Command Error]:', error);
      return interaction.reply({
        content: '❌ ไม่สามารถส่งข้อความได้ กรุณาตรวจสอบสิทธิ์ของบอทในห้องนั้น',
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};