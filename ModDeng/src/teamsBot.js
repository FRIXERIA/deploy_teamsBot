const { TeamsActivityHandler, CardFactory } = require("botbuilder");
const greeting_text = require('./adaptiveCards/greeting.json')
// Teams activity handler.
class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id) {
          await context.sendActivity({
            attachments: [CardFactory.adaptiveCard(greeting_text)]
          });
          break;
        }
      }
      await next();
    });
  }
  
}
module.exports.TeamsBot = TeamsBot;