const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('review')
    .setDescription('เขียนรีวิวและให้คะแนนร้านค้า IDONTKNOW')
    .addIntegerOption(option =>
      option
        .setName('rating')
        .setDescription('เลือกคะแนนความพึงพอใจ (1 - 5 ดาว)')
        .setRequired(true)
        .addChoices(
          { name: '⭐⭐⭐⭐⭐ (5/5 ดาว - ยอดเยี่ยม)', value: 5 },
          { name: '⭐⭐⭐⭐ (4/5 ดาว - ดีมาก)', value: 4 },
          { name: '⭐⭐⭐ (3/5 ดาว - ปานกลาง)', value: 3 },
          { name: '⭐⭐ (2/5 ดาว - พอใช้)', value: 2 },
          { name: '⭐ (1/5 ดาว - ควรปรับปรุง)', value: 1 }
        )
    )
    .addStringOption(option =>
      option
        .setName('comment')
        .setDescription('ข้อความรีวิวความประทับใจ')
        .setRequired(true)
    ),

  async execute(interaction) {
    const rating = interaction.options.getInteger('rating');
    const comment = interaction.options.getString('comment');
    const { user, guild } = interaction;

    const reviewChannelId = process.env.REVIEW_CHANNEL_ID;
    if (!reviewChannelId) {
      return interaction.reply({
        content: '❌ ยังไม่ได้ตั้งค่า REVIEW_CHANNEL_ID ในไฟล์ .env',
        flags: [MessageFlags.Ephemeral]
      });
    }

    const reviewChannel = guild.channels.cache.get(reviewChannelId) || 
                          await guild.channels.fetch(reviewChannelId).catch(() => null);

    if (!reviewChannel) {
      return interaction.reply({
        content: '❌ ไม่พบห้องส่งรีวิว กรุณาตรวจสอบ ID ห้องในไฟล์ .env',
        flags: [MessageFlags.Ephemeral]
      });
    }

    // แปลงจำนวนตัวเลขให้เป็นอิโมจิดาวสีทอง
    const starString = '⭐'.repeat(rating);

    // สร้างการ์ด Embed สไตล์เดียวกับในรูปตัวอย่าง
    const reviewEmbed = new EmbedBuilder()
      .setColor(0xe02b2b) // แถบสีแดงตามสไตล์ในรูป
      .setAuthor({ 
        name: 'IDONTKNOW STORE • รีวิวจากลูกค้า', 
        iconURL: interaction.client.user.displayAvatarURL() 
      })
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `## ${starString}\n` +
        `> ${comment}\n\n`
      )
      .addFields(
        { name: '👤 ลูกค้า', value: `<@${user.id}>`, inline: true },
        { name: '🏅 คะแนน', value: `**${rating} / 5**`, inline: true }
      )
      .setFooter({ text: 'IDONTKNOW • ขอบคุณที่ไว้วางใจเรา 🖤' })
      .setTimestamp();

    try {
      // ส่งการ์ดเข้าไปในห้องรีวิวสาธารณะ
      await reviewChannel.send({ embeds: [reviewEmbed] });

      // ตอบกลับผู้ใช้แบบเห็นคนเดียว
      return interaction.reply({
        content: '✅ ขอบคุณสำหรับรีวิวของคุณครับ! ข้อความถูกส่งไปยังห้องรีวิวเรียบร้อยแล้ว 🖤',
        flags: [MessageFlags.Ephemeral]
      });
    } catch (error) {
      console.error('Review Error:', error);
      return interaction.reply({
        content: `❌ เกิดข้อผิดพลาดในการส่งรีวิว: ${error.message}`,
        flags: [MessageFlags.Ephemeral]
      });
    }
  }
};