const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require('discord.js');

/**
 * ดักจับรูปภาพหลักฐานที่ลูกค้าส่งเข้ามาในห้อง Free Reward
 */
async function handleProofMessage(message) {
  if (message.author.bot) return;

  const targetChannelId = process.env.FREE_REWARD_CHANNEL_ID;
  const adminChannelId = process.env.ADMIN_VERIFY_CHANNEL_ID;
  const rewardRoleId = process.env.FREE_REWARD_ROLE_ID;

  if (message.channel.id !== targetChannelId) return;

  // ถ้าเป็นแอดมิน ให้พิมพ์/โพสต์ได้ปกติ บอทจะไม่ดักลบ
  if (message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return;
  }

  // ตรวจสอบว่าแนบไฟล์รูปภาพมาหรือไม่
  const imageAttachment = message.attachments.find((att) =>
    att.contentType?.startsWith('image/')
  );

  if (!imageAttachment) {
    const warn = await message.reply('⚠️ กรุณาแนบภาพแคปหน้าจอหลักฐานการกดติดตาม TikTok ครับ');
    setTimeout(() => {
      message.delete().catch(() => {});
      warn.delete().catch(() => {});
    }, 5000);
    return;
  }

  // ตรวจสอบว่าผู้ใช้มียศนี้อยู่แล้วหรือไม่
  if (message.member.roles.cache.has(rewardRoleId)) {
    const warn = await message.reply('⚠️ คุณได้รับยศกิจกรรมนี้ไปแล้วครับ');
    setTimeout(() => {
      message.delete().catch(() => {});
      warn.delete().catch(() => {});
    }, 5000);
    return;
  }

  // ส่งข้อมูลเข้าห้องตรวจสอบของแอดมิน
  const adminChannel = message.guild.channels.cache.get(adminChannelId);
  if (!adminChannel) return;

  const verifyEmbed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('✦ ตรวจสอบหลักฐานเควสต์ TikTok')
    .setThumbnail(message.author.displayAvatarURL())
    .addFields(
      { name: 'ผู้ส่งหลักฐาน', value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
      { name: 'ยศที่จะได้รับ', value: `<@&${rewardRoleId}>`, inline: true }
    )
    .setImage(imageAttachment.url)
    .setFooter({ text: `User ID: ${message.author.id}` })
    .setTimestamp();

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`verify_approve_${message.author.id}`)
      .setLabel('อนุมัติยศ')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`verify_reject_${message.author.id}`)
      .setLabel('ปฏิเสธ')
      .setStyle(ButtonStyle.Danger)
  );

  await adminChannel.send({ embeds: [verifyEmbed], components: [actionRow] });

  // ตอบกลับลูกค้าและลบข้อความในห้องเพื่อความสะอาด
  const confirmMsg = await message.reply('✅ ระบบได้รับหลักฐานของคุณแล้ว กรุณารอแอดมินตรวจสอบสักครู่ครับ');
  setTimeout(() => {
    message.delete().catch(() => {});
    confirmMsg.delete().catch(() => {});
  }, 4000);
}

/**
 * ดักจับการกดปุ่มของแอดมิน (อนุมัติ / ปฏิเสธ)
 */
async function handleAdminVerificationButton(interaction) {
  const { customId, guild } = interaction;
  const rewardRoleId = process.env.FREE_REWARD_ROLE_ID;

  if (customId.startsWith('verify_approve_')) {
    const targetUserId = customId.replace('verify_approve_', '');
    const member = await guild.members.fetch(targetUserId).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ ไม่พบผู้ใช้งานในเซิร์ฟเวอร์', flags: [MessageFlags.Ephemeral] });
    }

    await member.roles.add(rewardRoleId);

    // แจ้งเตือนเข้า DM สมาชิก
    member.send({
      content: `🎉 **หลักฐานของคุณได้รับการอนุมัติแล้ว!**\nระบบได้มอบยศ <@&${rewardRoleId}> และปลดล็อกห้องดาวน์โหลดให้คุณเรียบร้อยครับ ✦`
    }).catch(() => {});

    // อัปเดตข้อความในห้องแอดมิน ปิดปุ่มกด
    const oldEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
    oldEmbed.setColor(0x2ecc71);
    oldEmbed.addFields({ name: 'สถานะ', value: `✅ อนุมัติแล้วโดย <@${interaction.user.id}>` });

    await interaction.update({ embeds: [oldEmbed], components: [] });
  }

  if (customId.startsWith('verify_reject_')) {
    const targetUserId = customId.replace('verify_reject_', '');
    const member = await guild.members.fetch(targetUserId).catch(() => null);

    if (member) {
      member.send({
        content: '❌ **หลักฐานการกดติดตาม TikTok ของคุณไม่ผ่านการตรวจสอบ**\nกรุณาตรวจสอบรูปภาพและส่งใหม่อีกครั้งครับ'
      }).catch(() => {});
    }

    const oldEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
    oldEmbed.setColor(0xe74c3c);
    oldEmbed.addFields({ name: 'สถานะ', value: `❌ ปฏิเสธโดย <@${interaction.user.id}>` });

    await interaction.update({ embeds: [oldEmbed], components: [] });
  }
}

module.exports = { handleProofMessage, handleAdminVerificationButton };