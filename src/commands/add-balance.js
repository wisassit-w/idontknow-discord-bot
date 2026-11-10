const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addBalance, getBalance } = require('../services/userService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-balance')
    .setDescription('[Admin] เพิ่มเงิน/พ้อยท์ให้ผู้ใช้งานสำหรับทดสอบระบบ')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('target')
        .setDescription('ผู้ใช้ที่ต้องการเพิ่มพ้อยท์')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('จำนวนเงินที่ต้องการเพิ่ม')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const amount = interaction.options.getInteger('amount');

    try {
      // เรียกฟังก์ชันเพิ่มเงินของระบบ
      addBalance(targetUser.id, amount);
      const currentBalance = getBalance(targetUser.id);

      const embed = new EmbedBuilder()
        .setColor(0x050505)
        .setTitle('✦ เพิ่มพ้อยท์ทดสอบสำเร็จ ✦')
        .setDescription(
          `› **ผู้รับ** : <@${targetUser.id}>\n` +
          `› **ยอดที่เพิ่ม** : \`+${amount.toLocaleString()} บาท\`\n` +
          `› **ยอดคงเหลือปัจจุบัน** : \`${currentBalance.toLocaleString()} บาท\``
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });

    } catch (error) {
      console.error('[Add Balance Error]:', error);
      return interaction.reply({ 
        content: `❌ เกิดข้อผิดพลาด: ${error.message}`, 
        flags: [MessageFlags.Ephemeral] 
      });
    }
  }
};