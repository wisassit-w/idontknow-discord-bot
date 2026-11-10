const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const QR_IMAGE_URL = 'https://cdn.discordapp.com/attachments/1548295045583609917/1550192814883606528/Instagram_Post.png?ex=6aad7110&is=6aac1f90&hm=847d620480cecc434a3050443a4b37c897a73cec3286b45e7fc4875d8cdbcd5d&';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('qr')
    .setDescription('ส่งป้าย QR Code และข้อมูลชำระเงินให้ลูกค้า'),

  async execute(interaction) {
    const slipChannelId = process.env.SLIP_CHANNEL_ID || '1550076805845753926';

    const bankEmbed = new EmbedBuilder()
      .setColor(0x050505)
      .setAuthor({ 
        name: '✦ ช่องทางการชำระเงิน ・ ธนาคาร / PROMPTPAY ✦', 
        iconURL: interaction.client.user.displayAvatarURL() 
      })
      .setDescription(
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
        '╭─── ✦ **รายละเอียดบัญชีธนาคาร**\n' +
        `│ ✦ เลขที่บัญชี : \`${process.env.BANK_ACCOUNT_NUMBER || '1581674232'}\` *(คลิกเพื่อคัดลอก)*\n` +
        `│ ✦ ชื่อบัญชี : **${process.env.BANK_ACCOUNT_NAME || 'วิเศษสิทธิ์ วินสน'}**\n` +
        '╰───────────────────────────────\n\n' +
        '╭─── ✦ **รายละเอียด TrueMoney Wallet**\n' +
        `│ ✦ เบอร์วอลเล็ท : \`${process.env.WALLET_PHONE_NUMBER || '0806920637'}\` *(โอน Wallet +10 บาท)*\n` +
        `│ ✦ ชื่อบัญชี : **${process.env.BANK_ACCOUNT_NAME || 'วิเศษสิทธิ์ วินสน'}**\n` +
        '╰───────────────────────────────\n\n' +
        '› `ขั้นตอนการเติมเงิน` :\n' +
        '1. โอนเงินเข้าบัญชีตามยอดที่ต้องการ\n' +
        `2. นำภาพสลิปโอนเงินไปส่งที่ห้อง <#${slipChannelId}>\n` +
        '3. หรือแนบรูปภาพสลิปส่งในแชตนี้ได้ทันที\n\n' +
        '✧ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✧'
      )
      .setImage(QR_IMAGE_URL)
      .setFooter({ text: 'IDONTKNOW OFFICIAL • House of Darkness' })
      .setTimestamp();

    const slipButtonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('ไปยังห้องส่งสลิป')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${interaction.guildId}/${slipChannelId}`)
        .setEmoji('🧾')
    );

    // ส่งแบบสาธารณะในห้อง Ticket เพื่อให้ลูกค้าเห็นด้วย
    await interaction.reply({
      embeds: [bankEmbed],
      components: [slipButtonRow],
    });
  },
};