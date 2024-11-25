const { BotBuilderCloudAdapter } = require("@microsoft/teamsfx");
const ConversationBot = BotBuilderCloudAdapter.ConversationBot;
const config = require("./config");
const { GenericCommandHandler } = require("../genericCommandHandler");
const notificationApp = new ConversationBot({
  adapterConfig: config,
  notification: {
    enabled: true,
  },
  command: {
    enabled: true,
    commands: [new GenericCommandHandler()],
  },
});
module.exports = {
  notificationApp,
};
