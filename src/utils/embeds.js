const { EmbedBuilder } = require('discord.js');

// ธีมสีกลางของทั้งบอท (Dark Minimal)
const THEME = {
  COLOR_PRIMARY: 0x2b2d31, // เทาเข้ม (พื้นหลัง Discord dark)
  COLOR_SUCCESS: 0x57f287, // เขียว
  COLOR_ERROR: 0xed4245, // แดง
  COLOR_WARNING: 0xfee75c, // เหลือง
  FOOTER_TEXT: 'IDONTKNOW OFFICIAL • Est. 2026',
};

/** Embed พื้นฐานที่ทุก Embed ในบอทควรใช้ร่วมกัน เพื่อความสม่ำเสมอของธีม */
function baseEmbed() {
  return new EmbedBuilder()
    .setColor(THEME.COLOR_PRIMARY)
    .setFooter({ text: THEME.FOOTER_TEXT })
    .setTimestamp();
}

function successEmbed(title, description) {
  return baseEmbed().setColor(THEME.COLOR_SUCCESS).setTitle(`✅ ${title}`).setDescription(description);
}

function errorEmbed(title, description) {
  return baseEmbed().setColor(THEME.COLOR_ERROR).setTitle(`❌ ${title}`).setDescription(description);
}

function warningEmbed(title, description) {
  return baseEmbed().setColor(THEME.COLOR_WARNING).setTitle(`⚠️ ${title}`).setDescription(description);
}

module.exports = { THEME, baseEmbed, successEmbed, errorEmbed, warningEmbed };