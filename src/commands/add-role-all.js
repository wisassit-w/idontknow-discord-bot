const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-role-all')
    .setDescription('แจกยศให้สมาชิกทุกคนในเซิร์ฟเวอร์ (เฉพาะแอดมิน)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('เลือกยศที่ต้องการแจกให้ทุกคน')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const targetRole = interaction.options.getRole('role');
    const { guild } = interaction;

    // เช็คว่ายศของบอทอยู่สูงพอมั้ย
    const botMember = await guild.members.fetchMe();
    if (botMember.roles.highest.position <= targetRole.position) {
      return interaction.editReply({
        content: `❌ ไม่สามารถแจกยศ ${targetRole} ได้ เนื่องจากยศนี้อยู่สูงกว่าหรือเท่ายศของบอท กรุณาลากยศของบอทไว้ด้านบนใน Server Settings > Roles ครับ`
      });
    }

    await interaction.editReply({
      content: `⏳ กำลังดึงรายชื่อสมาชิกและเริ่มแจกยศ ${targetRole} ให้ทุกคน... กรุณารอสักครู่`
    });

    try {
      // ดึงสมาชิกทั้งหมดในเซิร์ฟเวอร์
      const members = await guild.members.fetch();
      let successCount = 0;
      let skippedCount = 0;
      let failCount = 0;

      for (const [_, member] of members) {
        // ข้ามบอทตัวอื่น (ถ้าอยากให้แจกบอทด้วย ให้ลบเงื่อนไข !member.user.bot ออก)
        if (member.user.bot) {
          skippedCount++;
          continue;
        }

        // ถ้ามียศนี้อยู่แล้วให้ข้าม
        if (member.roles.cache.has(targetRole.id)) {
          skippedCount++;
          continue;
        }

        try {
          await member.roles.add(targetRole);
          successCount++;
          // หน่วงเวลาเล็กน้อย 300ms เพื่อป้องกันการโดน Discord Rate Limit
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          failCount++;
        }
      }

      return interaction.editReply({
        content: `✅ **ดำเนินการแจกยศเสร็จสิ้น!**\n` +
                 `› ยศ: ${targetRole}\n` +
                 `› มอบสำเร็จ: **${successCount} คน**\n` +
                 `› ข้าม (มียศอยู่แล้ว/เป็นบอท): **${skippedCount} คน**\n` +
                 (failCount > 0 ? `› เกิดข้อผิดพลาด: **${failCount} คน**` : '')
      });

    } catch (error) {
      console.error('Error adding role to all members:', error);
      return interaction.editReply({
        content: `❌ เกิดข้อผิดพลาดในการดึงสมาชิก: ${error.message}`
      });
    }
  }
};