const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder 
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-shop')
    .setDescription('ติดตั้งแผงร้านค้าอัตโนมัติ')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      const shopEmbed = new EmbedBuilder()
        .setColor(0x050505)
        .setAuthor({ 
          name: '✦  IDONTKNOW STORE  ✦', 
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .addFields(
          { name: '✦ หมวดหมู่', value: '```2```', inline: true },
          { name: '✦ สินค้าทั้งหมด', value: '```2```', inline: true },
          { name: '✦ สต็อกคงเหลือ', value: '```99999```', inline: true }
        )
        .setDescription(
          '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
          '╭─── ✦ **IDONTKNOW ・ SETTING INTERNET & RESHADE**\n' +
          '│ ✦ *เลือกรายการ Internet Setting หรือ Reshade จากเมนูด้านล่าง*\n' +
          '│ ✦ *โอนชำระตามยอดรวม และแนบสลิปเพื่อตรวจสอบระบบ*\n' +
          '╰───────────────────────────────\n\n' +
          '› `AUTO DELIVERY` : รับยศ & ลิงก์ดาวน์โหลดออโต้ ทันที\n' +
          '› `CONDITION` : สลิป 1 ใบ / 1 รายการเท่านั้น (ห้ามใช้สลิปซ้ำ)\n' +
          '› `SERVICE TIME` : เปิดบริการ 24 ชม. (ระบบปิด 00:00 - 23:59)\n\n' +
          '✧ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✧'
        )
        .setImage('https://i.pinimg.com/originals/a3/d0/80/a3d08075767b9fc88fceb738c254bf92.gif')
        .setFooter({ 
          text: 'IDONTKNOW OFFICIAL • House of Darkness', 
          iconURL: interaction.guild?.iconURL() || interaction.client.user.displayAvatarURL() 
        })
        .setTimestamp();

      // เปลี่ยน emoji จาก ✦ เป็น ✨ และ ⚡
      const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_category')
          .setPlaceholder('⌕  [ เลือกหมวดหมู่สินค้าที่ต้องการสั่งซื้อ ]')
          .addOptions([
            {
              label: 'Setting Services',
              description: 'บริการปรับแต่งระบบ / เซ็ตติ้งคอม & อินเทอร์เน็ต',
              value: 'cat_setting',
              emoji: '⚡'
            },
            {
              label: 'Reshade Presets',
              description: 'พรีเซ็ตภาพสวย แสงเงาโทนภาพยนตร์และเกม',
              value: 'cat_reshade',
              emoji: '✨'
            }
          ])
      );

      // ใช้ emoji มาตรฐาน 💳 และ 💎 ที่ Discord รองรับ
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('shop_btn_topup')
          .setLabel('เติมเงินเข้าบัญชี 〃')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💳'),
        new ButtonBuilder()
          .setCustomId('shop_btn_balance')
          .setLabel('เช็คเงิน 〃')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('💎')
      );

      await interaction.channel.send({
        embeds: [shopEmbed],
        components: [selectMenu, buttons]
      });

      await interaction.editReply({ content: '✅ ติดตั้งแผงร้านค้าเรียบร้อยแล้ว!' });

    } catch (error) {
      console.error('[Shop Error]:', error);
      await interaction.editReply({ content: `❌ เกิดข้อผิดพลาด: ${error.message}` });
    }
  }
};