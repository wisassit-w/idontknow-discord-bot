const { Events, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const FormData = require('form-data');
const { addBalance } = require('../services/userService');
const { handleProofMessage } = require('../handlers/freeRewardHandler');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    // 1. ส่งต่อไปตรวจสอบเควสต์รับของฟรี (ห้อง TikTok Proof)
    await handleProofMessage(message);

    // 2. ตรวจสอบว่าข้อความส่งมาจากห้องสลิปหรือไม่
    const targetChannelId = process.env.SLIP_CHANNEL_ID;
    if (message.channel.id !== targetChannelId) return;

    // ตรวจสอบรูปภาพแนบในข้อความ
    const attachment = message.attachments.first();
    if (!attachment || !attachment.contentType?.startsWith('image/')) return;

    const checkingMsg = await message.reply({
      content: '⏳ `กำลังเชื่อมต่อระบบ SlipOK เพื่อตรวจสอบสลิปโอนเงิน...`'
    });

    try {
      // 1. ดาวน์โหลดรูปภาพ
      const imageResponse = await axios.get(attachment.url, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(imageResponse.data);

      // 2. เตรียม FormData
      const formData = new FormData();
      formData.append('files', imageBuffer, { filename: 'slip.jpg' });

      // 3. ส่ง Request ไปยัง SlipOK API
      const response = await axios.post(
        `https://api.slipok.com/api/line/apikey/${process.env.SLIPOK_BRANCH_ID}`,
        formData,
        {
          headers: {
            'x-authorization': process.env.SLIPOK_API_KEY?.trim(),
            ...formData.getHeaders()
          },
          timeout: 10000
        }
      );

      const slipData = response.data;

      // ลบรูปสลิปและข้อความตอบกลับในห้องทันที เพื่อความเป็นส่วนตัว
      setTimeout(() => {
        message.delete().catch(() => {});
        checkingMsg.delete().catch(() => {});
      }, 3000);

      if (slipData.success) {
        const data = slipData.data;
        const amount = Number(data.amount);
        const transRef = data.transRef || '-';

        // เพิ่มเครดิตเข้าบัญชีผู้ใช้
        if (typeof addBalance === 'function') {
          await addBalance(message.author.id, amount, transRef);
        }

        const successEmbed = new EmbedBuilder()
          .setColor(0x050505)
          .setAuthor({ 
            name: '✦  SLIP VERIFICATION SUCCESS  ✦', 
            iconURL: message.client.user.displayAvatarURL() 
          })
          .setDescription(
            '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
            `› **สถานะ** : ชำระเงินสำเร็จ (Slip Verified)\n` +
            `› **ยอดเงินที่ได้รับ** : \`\`\`+${amount.toLocaleString()} บาท\`\`\`\n` +
            `› **เลขอ้างอิง** : \`${transRef}\`\n` +
            `› **บัญชีผู้รับ** : ${process.env.BANK_ACCOUNT_NAME || 'IDONTKNOW SHOP'}\n\n` +
            '╰┈➤ ระบบได้เพิ่มยอดเครดิตเข้าบัญชีของคุณเรียบร้อยแล้ว\n' +
            '✧ สามารถนำเครดิตไปเลือกซื้อ Setting หรือ Reshade ได้ทันที ✧\n\n' +
            '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦'
          )
          .setFooter({ text: 'IDONTKNOW OFFICIAL • House of Darkness' })
          .setTimestamp();

        // ส่งเข้าแชตส่วนตัว (DM) ของคนเติม
        await message.author.send({ embeds: [successEmbed] }).catch(() => {
          message.channel.send({ content: `<@${message.author.id}> ชำระเงินสำเร็จ +${amount} บาท (กรุณาเปิดรับ DM เพื่อดูใบเสร็จ)` })
            .then(m => setTimeout(() => m.delete().catch(() => {}), 6000));
        });

        // ส่ง Log เข้าห้องแอดมินโดยเฉพาะ
        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (logChannelId) {
          const logChannel = message.guild.channels.cache.get(logChannelId) || 
                             await message.guild.channels.fetch(logChannelId).catch(() => null);

          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setColor(0x2b2d31)
              .setTitle('📝 [LOG] เติมเงินผ่านสลิปสำเร็จ')
              .addFields(
                { name: 'ผู้ใช้', value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
                { name: 'จำนวนเงิน', value: `+${amount.toLocaleString()} บาท`, inline: true },
                { name: 'เลขอ้างอิงสลิป', value: `\`${transRef}\``, inline: false }
              )
              .setTimestamp();
              
            await logChannel.send({ embeds: [logEmbed] });
          }
        }

      } else {
        const failEmbed = new EmbedBuilder()
          .setColor(0xff3333)
          .setAuthor({ name: '✦  SLIP VERIFICATION REJECTED  ✦' })
          .setDescription(
            '❌ **ไม่สามารถทำรายการได้**\n\n' +
            `› **เหตุผล** : \`${slipData.message || 'สลิปไม่ถูกต้อง หรือเคยถูกใช้งานไปแล้ว'}\`\n` +
            '› **เงื่อนไข** : สลิป 1 ใบสามารถใช้ทำรายการได้เพียง 1 ครั้งเท่านั้น\n\n' +
            '› *หากมีข้อสงสัย กรุณาเปิด Ticket เพื่อติดต่อแอดมิน*'
          )
          .setTimestamp();

        await message.author.send({ embeds: [failEmbed] }).catch(() => {});
      }

    } catch (error) {
      setTimeout(() => {
        message.delete().catch(() => {});
        checkingMsg.delete().catch(() => {});
      }, 3000);

      console.error('[SlipOK Error Details]:', error.response?.data || error.message);
      const errMsg = error.response?.data?.message || 'ภาพไม่ชัดเจน ไม่พบ QR Code หรือเกิดข้อผิดพลาด';
      
      await message.author.send({
        content: `⚠️ **ระบบไม่สามารถอ่านสลิปของคุณได้**: \`${errMsg}\``
      }).catch(() => {});
    }
  }
};