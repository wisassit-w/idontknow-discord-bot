const { Events } = require('discord.js');
const { handleCommand } = require('../handlers/commandHandler');
const { handleButton } = require('../handlers/buttonHandler');
const { handleSelectMenu } = require('../handlers/selectMenuHandler');
const { handleModal } = require('../handlers/modalHandler');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // แยกประเภท interaction แล้วส่งต่อให้ handler ที่รับผิดชอบแต่ละส่วน
    if (interaction.isChatInputCommand()) {
      return handleCommand(interaction);
    }

    if (interaction.isButton()) {
      return handleButton(interaction);
    }

    if (interaction.isStringSelectMenu()) {
      return handleSelectMenu(interaction);
    }

    if (interaction.isModalSubmit()) {
      return handleModal(interaction);
    }
  },
};
