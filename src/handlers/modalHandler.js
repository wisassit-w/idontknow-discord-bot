const { EmbedBuilder, MessageFlags } = require('discord.js');
const { extractVoucherHash, redeemVoucher } = require('../services/truemoneyService');
const { addBalance, getBalance, deductBalance } = require('../services/userService');
const { findUserByCode, processReferralReward, getUserAffiliate } = require('../utils/affiliateManager');
const { grantProductRoles, PRODUCT_ROLES } = require('./buttonHandler');
const { sendOrderFeed } = require('../services/orderFeedService');
const fs = require('fs');

async function handleModal(interaction) {
  const { customId, user, guild } = interaction;

  // ================================
  // 1. รับซองของขวัญ TrueMoney
  // ================================
  if (customId === 'modal_truemoney_redeem' || customId === 'topup_truemoney_modal') {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const rawInput = interaction.fields.getTextInputValue('truemoney_link_input') 
      || interaction.fields.getTextInputValue('voucher_link');
    const voucherHash = extractVoucherHash(rawInput);

    if (!voucherHash) {
      return await interaction.editReply({
        content: '❌ **ลิงก์ซองของขวัญไม่ถูกต้อง** กรุณาตรวจสอบลิงก์ใหม่อีกครั้ง'
      });
    }

    const result = await redeemVoucher(voucherHash);

    if (result.success) {
      const amount = result.amount;

      if (typeof addBalance === 'function') {
        await addBalance(user.id, amount, `TMN-${voucherHash}`);
      }

      const successEmbed = new EmbedBuilder()
        .setColor(0x050505)
        .setAuthor({ 
          name: '✦  TRUEMONEY REDEEM SUCCESS  ✦', 
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setDescription(
          '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
          `› **สถานะ** : รับเงินเข้ากระเป๋าสำเร็จ\n` +
          `› **ยอดเงินที่ได้รับ** : \`\`\`+${amount.toLocaleString()} บาท\`\`\`\n` +
          `› **รหัสซอง** : \`${voucherHash}\`\n\n` +
          '╰┈➤ เครดิตถูกเพิ่มเข้าบัญชีของคุณเรียบร้อยแล้ว\n\n' +
          '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦'
        )
        .setFooter({ text: 'IDONTKNOW OFFICIAL • Est. 2026' })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });

      const logChannelId = process.env.LOG_CHANNEL_ID;
      if (logChannelId) {
        const logChannel = guild.channels.cache.get(logChannelId) || 
                           await guild.channels.fetch(logChannelId).catch(() => null);

        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle('🧧 [LOG] เติมเงินผ่านซอง TrueMoney สำเร็จ')
            .addFields(
              { name: 'ผู้ใช้', value: `${user.tag} (<@${user.id}>)`, inline: true },
              { name: 'จำนวนเงิน', value: `+${amount.toLocaleString()} บาท`, inline: true },
              { name: 'Hash ซอง', value: `\`${voucherHash}\``, inline: false }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      }

    } else {
      return await interaction.editReply({
        content: `❌ **ไม่สามารถรับเงินได้**: \`${result.message}\``
      });
    }
    return;
  }

  // ================================
  // 2. ยืนยันการสั่งซื้อ Dontcry V1
  // ================================
  if (customId === 'modal_checkout_dontcry_v1') {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const rawCode = interaction.fields.getTextInputValue('referral_code_input');
    const inputCode = rawCode ? rawCode.trim().replace(/\s+/g, '').toUpperCase() : '';

    const basePrice = 29;
    let discount = 0;
    let discountDetail = '';
    let referrer = null;
    let isPromoCodeUsed = false;

    const buyerProfile = getUserAffiliate(user.id);
    const hasMilestoneReward = buyerProfile.referralCount >= 5;

    // ตรวจสอบกรณีมีการพิมพ์โค้ด
    if (inputCode.length > 0) {
      if (inputCode === 'IDONTOPEN') {
        const promoFilePath = './data/promotions.json';
        let promoData = { idontopen: { usedCount: 0, usedUsers: [] } };

        if (fs.existsSync(promoFilePath)) {
          try {
            promoData = JSON.parse(fs.readFileSync(promoFilePath, 'utf8'));
          } catch (_) {}
        }

        if (promoData.idontopen.usedUsers.includes(user.id)) {
          return interaction.editReply({ 
            content: '❌ **คุณได้ใช้สิทธิ์โค้ดโปรโมชั่น `IDONTOPEN` ไปแล้วครับ** (จำกัด 1 สิทธิ์ต่อบัญชี)' 
          });
        }

        if (promoData.idontopen.usedCount >= 20) {
          return interaction.editReply({ 
            content: '❌ **โค้ดโปรโมชั่น `IDONTOPEN` ครบกำหนด 20 สิทธิ์แรกแล้วครับ!**' 
          });
        }

        discount = 10;
        discountDetail = 'ส่วนลดโปรโมชั่นเปิดร้าน 10 บาท';
        isPromoCodeUsed = true;
      } else {
        referrer = findUserByCode(inputCode);

        if (!referrer) {
          return interaction.editReply({ 
            content: '❌ **ไม่พบโค้ดแนะนำหรือส่วนลดนี้ในระบบ**\nหากไม่มีโค้ด ให้เว้นว่างช่องดังกล่าวไว้เพื่อทำรายการสั่งซื้อได้เลยครับ' 
          });
        } else if (referrer.userId === user.id) {
          return interaction.editReply({ 
            content: '❌ **คุณไม่สามารถใช้โค้ดแนะนำของตนเองได้**\nกรุณาเว้นว่างช่องโค้ดเพื่อทำรายการสั่งซื้อครับ' 
          });
        } else if (buyerProfile.usedReferralCode) {
          return interaction.editReply({ 
            content: '⚠️ **คุณเคยใช้สิทธิ์โค้ดส่วนลดแนะนำเพื่อนไปแล้ว** (จำกัด 1 สิทธิ์ต่อบัญชี)\nกรุณาเว้นว่างช่องโค้ดเพื่อทำรายการสั่งซื้อครับ' 
          });
        }

        discount = 5;
        discountDetail = 'ส่วนลดแนะนำเพื่อน 5 บาท';
      }
    }

    // สิทธิ์ชวนเพื่อนครบ 5 คน รับส่วนลด 15 บาท
    if (hasMilestoneReward && 15 > discount) {
      discount = 15;
      discountDetail = 'โบนัสชวนเพื่อนครบ 5 คน ลดทันที 15 บาท';
    }

    const finalPrice = Math.max(0, basePrice - discount);
    const currentBalance = getBalance(user.id) || 0;
    const member = await guild.members.fetch(user.id);

    if (currentBalance < finalPrice) {
      return interaction.editReply({
        content: `❌ **ยอดเงินคงเหลือไม่เพียงพอ**\nยอดของคุณ: **${currentBalance} บาท** (ยอดชำระสุทธิ **${finalPrice} บาท**${discount > 0 ? ` [${discountDetail} -${discount} บาท]` : ''})\nกรุณาเติมเงินก่อนทำรายการครับ`
      });
    }

    try {
      // 1. หักเงิน
      if (typeof deductBalance === 'function') {
        deductBalance(user.id, finalPrice);
      }

      // 2. บันทึกการใช้งานโค้ดโปรโมชั่น
      if (isPromoCodeUsed) {
        const promoFilePath = './data/promotions.json';
        let promoData = { idontopen: { usedCount: 0, usedUsers: [] } };
        if (fs.existsSync(promoFilePath)) {
          try {
            promoData = JSON.parse(fs.readFileSync(promoFilePath, 'utf8'));
          } catch (_) {}
        }
        promoData.idontopen.usedCount += 1;
        promoData.idontopen.usedUsers.push(user.id);
        fs.writeFileSync(promoFilePath, JSON.stringify(promoData, null, 2));
      }

      // 3. มอบยศสินค้า + ยศลูกค้าอัตโนมัติ
      await grantProductRoles(member, 'item_dontcry_v1');

      // 4. ส่งฟีดเข้าห้อง Order Feed สาธารณะ
      await sendOrderFeed(guild, user, 'Dontcry V1', finalPrice);

      // 5. จัดการแต้มและเงินคืนให้ผู้แนะนำ (กรณีใช้โค้ดเพื่อน)
      if (referrer) {
        processReferralReward(user.id, referrer.userId, 5);
        try {
          const referrerUser = await interaction.client.users.fetch(referrer.userId);
          if (referrerUser) {
            await referrerUser.send(`🎉 เพื่อนของคุณใช้โค้ด **${referrer.code}** สั่งซื้อสินค้าสำเร็จ!\n💰 คุณได้รับเครดิตเงินคืน **+5 บาท** (สถิติปัจจุบัน: ${referrer.referralCount + 1}/5 คน)`);
          }
        } catch (_) {}
      }

      const v1RoleId = PRODUCT_ROLES.item_dontcry_v1;
      const roleTag = v1RoleId ? `<@&${v1RoleId}>` : '**Dontcry V1**';

      const successNotice = discount > 0 
        ? `✅ **สั่งซื้อสินค้าสำเร็จ!**\nยอดเงินที่หัก: **${finalPrice} บาท** (ได้รับ${discountDetail})\nมอบยศ ${roleTag} และยศลูกค้า ปลดล็อกห้องดาวน์โหลดให้เรียบร้อยแล้วครับ ✦`
        : `✅ **สั่งซื้อสินค้าสำเร็จ!**\nยอดเงินที่หัก: **${finalPrice} บาท** (ราคาปกติ)\nมอบยศ ${roleTag} และยศลูกค้า ปลดล็อกห้องดาวน์โหลดให้เรียบร้อยแล้วครับ ✦`;

      return interaction.editReply({ content: successNotice });

    } catch (err) {
      console.error('[Checkout Error]:', err);
      return interaction.editReply({ content: `❌ เกิดข้อผิดพลาดในการสั่งซื้อ: ${err.message}` });
    }
  }

  // ================================
  // 3. จัดการการส่งรีวิวจากปุ่ม Ticket
  // ================================
  if (customId === 'modal_ticket_review') {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const rawRating = interaction.fields.getTextInputValue('review_rating_input');
    const comment = interaction.fields.getTextInputValue('review_comment_input');

    let rating = parseInt(rawRating.trim(), 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      rating = 5;
    }

    const reviewChannelId = process.env.REVIEW_CHANNEL_ID;
    if (!reviewChannelId) {
      return interaction.editReply({
        content: '❌ ยังไม่ได้ระบุ REVIEW_CHANNEL_ID ในไฟล์ .env'
      });
    }

    const reviewChannel = guild.channels.cache.get(reviewChannelId) || 
                          await guild.channels.fetch(reviewChannelId).catch(() => null);

    if (!reviewChannel) {
      return interaction.editReply({
        content: '❌ ไม่พบห้องรีวิว กรุณาตรวจสอบ ID ห้องในไฟล์ .env'
      });
    }

    const starString = '⭐'.repeat(rating);

    const reviewEmbed = new EmbedBuilder()
      .setColor(0xe02b2b)
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
      await reviewChannel.send({ embeds: [reviewEmbed] });

      return interaction.editReply({
        content: '✅ ขอบคุณสำหรับรีวิวของคุณครับ! รีวิวถูกส่งไปยังห้องรวมรีวิวเรียบร้อยแล้ว 🖤'
      });
    } catch (err) {
      console.error('Ticket Review Send Error:', err);
      return interaction.editReply({
        content: `❌ เกิดข้อผิดพลาดในการส่งรีวิว: ${err.message}`
      });
    }
  }
}

module.exports = { handleModal };