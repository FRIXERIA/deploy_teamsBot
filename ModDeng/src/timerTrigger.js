const notificationTemplate = require("./adaptiveCards/notification-default.json");
const ACData = require("adaptivecards-templating");
const { notificationApp } = require("./internal/initialize");
const axios = require('axios');


// Function to fetch notifications from your Java backend
const fetchNotificationsByEmail = async (email) => {
  try {
    const response = await axios.get(`http://localhost:8080/api/notification/${email}`);
    // const response = await axios.get(`https://cp24or2.sit.kmutt.ac.th/api/notification/${email}`);
    console.log('fetch!!')
    console.log('data', response.data)
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

module.exports = async function (context, myTimer) {
  const pageSize = 100;
  let continuationToken = undefined;

  do {
    const pagedData = await notificationApp.notification.getPagedInstallations(pageSize, continuationToken);
    const installations = pagedData.data;
    continuationToken = pagedData.continuationToken;

    try {
      const members = await notificationApp.notification.findAllMembers(async (m) => m.account.email);
      if (!members || members.length === 0) {
        console.log("No members found.");
        continue;
      }
      for (const member of members) {
        if (member.account && member.account.email) {
          const userEmail = member.account.email;
          console.log('userEmail =', userEmail)
          console.log('user_Account =', member.account)
          // Fetch notifications from the Java backend
          const notifications = await fetchNotificationsByEmail(userEmail);
          for (const notification of notifications) {
            const assign = notification.activity;
            // Case 1: Start date is today
            if (notification.notificationType === 'reminder_task') {
              await member.sendAdaptiveCard(
                new ACData.Template(notificationTemplate).expand({
                      $root: {
                        title: "Task Reminder",
                        courseId: `${assign.classEntity.code}`,
                        nameTask: `${assign.title}`,
                        description: assign.description ? `${assign.description}` : "",
                        startDate: `${assign.startDate}`,
                        dueDate: `${assign.dueDate}`,
                        notificationUrl: "https://app.leb2.org/class",
                      }
                    })
              );
            }
            // Case 2: Due date is tomorrow
            if (notification.notificationType === 'due_tomorrow') {
              await member.sendAdaptiveCard(
                new ACData.Template(notificationTemplate).expand({
                  $root: {
                    title: "Task Due Tomorrow",
                    courseId: `${assign.classEntity.code}`,
                    nameTask: `${assign.title}`,
                    description: assign.description ? `${assign.description}` : "",
                    startDate: `${assign.startDate}`,
                    dueDate: `${assign.dueDate}`,
                    notificationUrl: "https://app.leb2.org/class",
                  }
                })
              );
            }

            // Case 3: After due date
            if (notification.notificationType === 'after_due') {
              await member.sendAdaptiveCard(
                new ACData.Template(notificationTemplate).expand({
                  $root: {
                    title: "Task Overdue",
                    courseId: `${assign.classEntity.code}`,
                    nameTask: `${assign.title}`,
                    description: assign.description ? `${assign.description}` : "",
                    startDate: `${assign.startDate}`,
                    dueDate: `${assign.dueDate}`,
                    notificationUrl: "https://app.leb2.org/class",
                  }
                })
              );
            }
          }
        }
      }
      console.log("Notifications processed successfully.");
    } catch (error) {
      console.error("Error processing notifications:", error);
    }
  } while (continuationToken);
};