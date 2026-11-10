const { errorEmbed } = require('../utils/embeds');
const logger = require('../utils/logger');

/**
 * จัดการทุก interaction ที่เป็น Slash Command (ChatInputCommand)
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function handleCommand(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn('Command', `ไม่พบคำสั่ง: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error('Command', `รันคำสั่ง ${interaction.commandName} ผิดพลาด: ${err.stack}`);

    const errorPayload = { embeds: [errorEmbed('เกิดข้อผิดพลาด', 'ไม่สามารถรันคำสั่งนี้ได้ กรุณาลองใหม่อีกครั้ง')], flags: [MessageFlags.Ephemeral] };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorPayload);
    } else {
      await interaction.reply(errorPayload);
    }
  }
}

module.exports = { handleCommand };
