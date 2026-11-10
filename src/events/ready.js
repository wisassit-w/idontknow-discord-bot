const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.success('Bot', `ล็อกอินสำเร็จในชื่อ ${client.user.tag}`);

    client.user.setPresence({
      activities: [{ name: 'IDONTKNOW SHOP | เปิด 24 ชม.', type: ActivityType.Watching }],
      status: 'online',
    });
  },
};
