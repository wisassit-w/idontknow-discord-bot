const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserAffiliate } = require('../utils/affiliateManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('affiliate')
    .setDescription('ตรวจสอบโค้ดแนะนำเพื่อน แต้มสะสม และแลกรับของรางวัล'),

  async execute(interaction) {
    const userProfile = getUserAffiliate(interaction.user.id);
    const targetCount = 5;
    const isReadyToClaim = userProfile.referralCount >= targetCount && !userProfile.hasClaimedFreeRole;

    const embed = new EmbedBuilder()
      .setColor(0x050505)
      .setAuthor({ 
        name: `✦  IDONTKNOW ・ AFFILIATE SYSTEM  ✦`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setDescription(
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
        `╭─── ✦ **รหัสแนะนำของคุณ**\n` +
        `│ ✦ โค้ดส่วนลด : \`${userProfile.code}\` *(คลิกเพื่อคัดลอก)*\n` +
        `│ ✦ เครดิตเงินคืนสะสม : **${userProfile.cashbackBalance} บาท**\n` +
        `│ ✦ สถิติชวนเพื่อนซื้อสำเร็จ : **${userProfile.referralCount} / ${targetCount} คน**\n` +
        '╰───────────────────────────────\n\n' +
        '› `สิทธิประโยชน์ระบบแนะนำ` :\n' +
        '• ให้เพื่อนนำโค้ดไปกรอกตอนซื้อ: เพื่อนได้ส่วนลด **5 บาท**\n' +
        '• คุณได้รับเครดิตเข้ากระเป๋าอัตโนมัติ **+5 บาท / คน**\n' +
        `• ชวนเพื่อนซื้อครบ ${targetCount} คน รับฟรีทันทียศ **Dontcry V1**\n\n` +
        '✧ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✧'
      )
      .setFooter({ text: 'IDONTKNOW OFFICIAL • House of Darkness' })
      .setTimestamp();

    const claimButton = new ButtonBuilder()
      .setCustomId('btn_claim_affiliate_reward')
      .setLabel(
        userProfile.hasClaimedFreeRole 
          ? 'รับรางวัลฟรีแล้ว' 
          : (isReadyToClaim ? '🎁 กดแลกรับ Dontcry V1 ฟรี!' : `สะสมอีก ${targetCount - userProfile.referralCount} คนเพื่อปลดล็อก`)
      )
      .setStyle(isReadyToClaim ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(!isReadyToClaim);

    const row = new ActionRowBuilder().addComponents(claimButton);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: [MessageFlags.Ephemeral]
    });
  }
};