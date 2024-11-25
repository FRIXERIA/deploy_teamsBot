const { TeamsActivityHandler, CardFactory } = require("botbuilder");
const greeting_text = require('./adaptiveCards/greeting.json')

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
  //   this.onMessage(async (context, next) => {
  //     const userMessage = context.activity.text.toLowerCase();
  //     if (userMessage === 'hi') {
  //         await context.sendActivity('Hello! How can I help you?');
  //     } else {
  //         await context.sendActivity('I did not understand that.');
  //     }
  //     await next();
  // });
  }
  
}
module.exports.TeamsBot = TeamsBot;