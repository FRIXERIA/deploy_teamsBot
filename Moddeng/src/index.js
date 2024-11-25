const notificationTemplate = require("./adaptiveCards/notification-default.json");
const { notificationApp } = require("./internal/initialize");
const { AdaptiveCards } = require("@microsoft/adaptivecards-tools");
const { TeamsBot } = require("./teamsBot");
const restify = require("restify");

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nApp Started, ${server.name} listening to ${server.url}`);
});

function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000); // Create Date object from UTC timestamp

  // Options for formatting in English (adjust to your locale if needed)
  const options = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC' // Keep it in UTC
  };

  return date.toLocaleString('en-GB', options);
}


// HTTP trigger to send notification. You need to add authentication / authorization for this API. Refer https://aka.ms/teamsfx-notification for more details.
server.post(
  "/api/notification",
  restify.plugins.queryParser(),
  restify.plugins.bodyParser(),
  async (req, res) => {
    const pageSize = 100;
    let continuationToken = undefined;
    try {
      const notifications = req.body;
      const members = await notificationApp.notification.findAllMembers(async (m) => m.account.email);
      console.log(members);

      if (!members || members.length === 0) {
        console.log(`No member`);
        return res.send(404, { error: `No installation found` }); // Early return if no members found
      }

      // Track errors and successes
      const failedNotifications = [];
      const successNotifications = [];

      do {
        const pagedData = await notificationApp.notification.getPagedInstallations(pageSize, continuationToken);
        const installations = pagedData.data;
        continuationToken = pagedData.continuationToken;

        for (const member of members) {
          for (const notification of notifications) {
            console.log(notifications)
            if (member.account.email !== notification.email) {
              console.log(`No member or sendAdaptiveCard method found for email: ${notification.email}`);
              failedNotifications.push(notification.email);
              continue;
            }

            const assign = notification.activity;
            const exam = notification.examination;
            try {
              // Send notification for activity
              if (assign !== null) {
                await member.sendAdaptiveCard(
                  AdaptiveCards.declare(notificationTemplate).render({
                    title: "Task Reminder",
                    courseId: `${assign.classEntity.code}`,
                    nameTask: `${assign.title}`,
                    description: assign.description || "",
                    startDate: `${formatTimestamp(assign.startDate)}`,
                    dueDate: `${formatTimestamp(assign.dueDate)}`,
                    category:`${notification.category}`,
                    type: `${notification.notificationType}`,
                    notificationUrl: "https://www.leb2.org/",
                  })
                );
              }

              // Send notification for exam
              if (exam !== null) {
                await member.sendAdaptiveCard(
                  AdaptiveCards.declare(notificationTemplate).render({
                    title: "Task Reminder",
                    courseId: `${exam.classEntity.code}`,
                    nameTask: `${exam.title}`,
                    description: exam.description || "",
                    startDate: `${formatTimestamp(exam.startDate)}`,
                    dueDate: `${formatTimestamp(exam.dueDate)}`,
                    category:`${notification.category}`,
                    type: `${notification.notificationType}`,
                    notificationUrl: "https://www.leb2.org/",
                  })
                );
              }

              successNotifications.push(notification.email);
            } catch (err) {
              console.error("Error sending notification:", err);
              failedNotifications.push(notification.email);
            }
          }
        }
      } while (continuationToken);

      // Send final response after the loop finishes
      if (failedNotifications.length > 0) {
        return res.send(500, { error: "Failed to send notification to some users", failedNotifications });
      }

      res.send(200, { success: true, message: "Notifications sent successfully", successNotifications });
    } catch (error) {
      console.error("Error processing notifications:", error);
      res.send(500, { error: "Failed to process notifications." });
    }
  }
);

// Bot Framework message handler.
const teamsBot = new TeamsBot();
server.post("/api/messages", async (req, res) => {
  await notificationApp.requestHandler(req, res, async (context) => {
    await teamsBot.run(context);
  });
});

// const notificationTemplate = require("./adaptiveCards/notification-default.json");
// const { notificationApp } = require("./internal/initialize");
// const ACData = require("adaptivecards-templating");
// const { TeamsBot } = require("./teamsBot");
// const restify = require("restify");

// // Create HTTP server.
// const server = restify.createServer();
// server.use(restify.plugins.bodyParser());
// server.listen(process.env.port || process.env.PORT || 3978, () => {
//   console.log(`\nApp Started, ${server.name} listening to ${server.url}`);
// });

// // HTTP trigger to send notification. You need to add authentication / authorization for this API. Refer https://aka.ms/teamsfx-notification for more details.
// server.post(
//   "/api/notification",
//   restify.plugins.queryParser(),
//   restify.plugins.bodyParser(), // Add more parsers if needed
//   async (req, res) => {
//     const pageSize = 100;
//     let continuationToken = undefined;
//     do {
//       const pagedData = await notificationApp.notification.getPagedInstallations(
//         pageSize,
//         continuationToken
//       );
//       const installations = pagedData.data;
//       continuationToken = pagedData.continuationToken;

//       for (const target of installations) {
//         await target.sendAdaptiveCard(
//           new ACData.Template(notificationTemplate).expand({
//             $root: {
//               title: "New Event Occurred!",
//               appName: "Contoso App Notification",
//               description: `This is a sample http-triggered notification to ${target.type}`,
//               notificationUrl: "https://aka.ms/teamsfx-notification-new",
//             },
//           })
//         );

//         /****** To distinguish different target types ******/
//         /** "Channel" means this bot is installed to a Team (default to notify General channel)
//         if (target.type === NotificationTargetType.Channel) {
//           // Directly notify the Team (to the default General channel)
//           await target.sendAdaptiveCard(...);

//           // List all channels in the Team then notify each channel
//           const channels = await target.channels();
//           for (const channel of channels) {
//             await channel.sendAdaptiveCard(...);
//           }

//           // List all members in the Team then notify each member
//           const pageSize = 100;
//           let continuationToken = undefined;
//           do {
//             const pagedData = await target.getPagedMembers(pageSize, continuationToken);
//             const members = pagedData.data;
//             continuationToken = pagedData.continuationToken;

//             for (const member of members) {
//               await member.sendAdaptiveCard(...);
//             }
//           } while (continuationToken);
//         }
//         **/

//         /** "Group" means this bot is installed to a Group Chat
//         if (target.type === NotificationTargetType.Group) {
//           // Directly notify the Group Chat
//           await target.sendAdaptiveCard(...);

//           // List all members in the Group Chat then notify each member
//           const pageSize = 100;
//           let continuationToken = undefined;
//           do {
//             const pagedData = await target.getPagedMembers(pageSize, continuationToken);
//             const members = pagedData.data;
//             continuationToken = pagedData.continuationToken;

//             for (const member of members) {
//               await member.sendAdaptiveCard(...);
//             }
//           } while (continuationToken);
//         }
//         **/

//         /** "Person" means this bot is installed as a Personal app
//         if (target.type === NotificationTargetType.Person) {
//           // Directly notify the individual person
//           await target.sendAdaptiveCard(...);
//         }
//         **/
//       }
//     } while (continuationToken);

//     /** You can also find someone and notify the individual person
//     const member = await notificationApp.notification.findMember(
//       async (m) => m.account.email === "someone@contoso.com"
//     );
//     await member?.sendAdaptiveCard(...);
//     **/

//     /** Or find multiple people and notify them
//     const members = await notificationApp.notification.findAllMembers(
//       async (m) => m.account.email?.startsWith("test")
//     );
//     for (const member of members) {
//       await member.sendAdaptiveCard(...);
//     }
//     **/

//     res.json({});
//   }
// );

// // Bot Framework message handler.
// const teamsBot = new TeamsBot();
// server.post("/api/messages", async (req, res) => {
//   await notificationApp.requestHandler(req, res, async (context) => {
//     await teamsBot.run(context);
//   });
// });
