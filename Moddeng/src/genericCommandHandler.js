class GenericCommandHandler {
  triggerPatterns = new RegExp(/^.+$/);

  async handleCommandReceived(context, message) {
    // verify the command arguments which are received from the client if needed.
    console.log(`App received message: ${message.text}`);
    let response = "";
    switch (message.text) {
      case "Hi":
        response =
          "Hi there! I'm your ModDeng Bot, here to assist you with your tasks. Type 'help' for a list of available commands.";
        break;
      case "hi":
        response =
          "Hi there! I'm your ModDeng Bot, here to assist you with your tasks. Type 'help' for a list of available commands.";
        break;
      case "hello":
        response =
          "Hello! I'm your ModDeng Bot, always ready to help you out. If you need assistance, just type 'help' to see the available commands.";
        break;
      case "help":
        response =
          "Here's a list of commands I can help you with:\n" +
          "- 'Hi' or 'hello': Say hi or hello to me, and I'll greet you back.\n" +
          "- 'Help': Get a list of available commands.\n" +
          "\nFeel free to ask for help anytime you need it!";
        break;
      case "task today":
        response =
          "Here's a list of commands I can help you with:\n" 
        break;
      default:
        response = `Sorry, command unknown. Please type 'help' to see the list of available commands.`;
    }
    return response;
  }
}

module.exports = {
  GenericCommandHandler,
};
