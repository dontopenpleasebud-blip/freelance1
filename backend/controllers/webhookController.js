const axios = require("axios");
const CustomerRecord = require("../models/CustomerRecord");

exports.verifyWebhook = async (req, res) => {
  try {
    const mode = req.query["hub.mode"];
    const challenge = req.query["hub.challenge"];
    const verifyToken = req.query["hub.verify_token"];
    console.log("mode", mode);
    console.log("challenge", challenge);
    console.log("verifyToken", verifyToken);
    if (
      mode === "subscribe" &&
      verifyToken === process.env.WHATSAPP_VERIFY_TOKEN
    ) {
      res.status(200).send(challenge);
    } else {
      res.status(403).json({ message: "Invalid webhook" });
    }
  } catch (error) {
    console.log("Error while verifying webhook:", error);
    res.status(500).json({ message: "Failed to verify webhook" });
  }
};

// exports.webhookEvents = async (req, res) => {
//   try {
//     const body = req.body;
//     console.log("Webhook received:", JSON.stringify(body, null, 2));

//     // 1. Check if it's a WhatsApp Business Account event
//     if (body.object === "whatsapp_business_account") {
//       // 2. Safely check if this is an incoming message
//       if (
//         body.entry &&
//         body.entry[0].changes &&
//         body.entry[0].changes[0].value.messages && // FIXED: Changed to "messages" (plural)
//         body.entry[0].changes[0].value.messages[0]
//       ) {
//         const value = body.entry[0].changes[0].value;
//         const phnNumberId = value.metadata.phone_number_id;
//         const messageObj = value.messages[0];

//         const messageFrom = messageObj.from;
//         const messageId = messageObj.id;
//         const messageTimestamp = messageObj.timestamp;

//         console.log("Phone Number Id:", phnNumberId);
//         console.log("Message From:", messageFrom);
//         console.log("Message Id:", messageId);

//         // 3. Ensure it's a text message before trying to read 'text.body'
//         if (messageObj.type === "text") {
//           const messageText = messageObj.text.body.toLowerCase();
//           console.log("Message Text:", messageText);
//           if (messageText === "stop") {
//             const customer = await CustomerRecord.findOne({
//               customerPhone: messageFrom,
//             });
//             if (!customer) {
//               await CustomerRecord.create({
//                 customerPhone: messageFrom,
//                 optOut: true,
//               });
//               return res.status(200).json({ message: "Customer opted out" });
//             }
//             try {
//               // 4. Await the Axios call and use the Authorization header
//               await axios({
//                 method: "POST",
//                 url: `https://graph.facebook.com/v25.0/${phnNumberId}/messages`,
//                 data: {
//                   messaging_product: "whatsapp",
//                   to: messageFrom,
//                   text: {
//                     body: "Its sad to see you stopping our notifications. To resume , message us 'START' or 'CONTINUE'.",
//                   },
//                 },
//                 headers: {
//                   "Content-Type": "application/json",
//                   Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, // Standard auth method
//                 },
//               });
//               console.log("Reply sent successfully.");
//             } catch (apiError) {
//               console.log(
//                 "Error sending WhatsApp reply:",
//                 apiError.response ? apiError.response.data : apiError.message,
//               );
//             }
//           }
//           else if (messageText === "start" || messageText === "continue") {
//             const customer = await CustomerRecord.findOne({
//               customerPhone: messageFrom,
//             });
//             if (!customer) {
//               await CustomerRecord.create({
//                 customerPhone: messageFrom,
//                 optOut: false,
//               });
//               return res.status(200).json({ message: "Customer opted in" });
//             }
//             try {
//               // 4. Await the Axios call and use the Authorization header
//               await axios({
//                 method: "POST",
//                 url: `https://graph.facebook.com/v25.0/${phnNumberId}/messages`,
//                 data: {
//                   messaging_product: "whatsapp",
//                   to: messageFrom,
//                   text: {
//                     body: "Welcome back to SLG! You can now receive notifications.",
//                   },
//                 },
//                 headers: {
//                   "Content-Type": "application/json",
//                   Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, // Standard auth method
//                 },
//               });
//               console.log("Reply sent successfully.");
//             } catch (apiError) {
//               console.log(
//                 "Error sending WhatsApp reply:",
//                 apiError.response ? apiError.response.data : apiError.message,
//               );
//             }
//           }
//         }
//       }

//       // 5. CRITICAL: Always return 200 OK for any valid WhatsApp webhook (including read/delivered receipts)
//       res.sendStatus(200);
//     } else {
//       // If the event is not from WhatsApp, return 404
//       res.sendStatus(404);
//     }
//   } catch (error) {
//     console.log("Error while processing webhook:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

exports.webhookEvents = async (req, res) => {
  try {
    const body = req.body;
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    if (body.object === "whatsapp_business_account") {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const value = body.entry[0].changes[0].value;
        const phnNumberId = value.metadata.phone_number_id;
        const messageObj = value.messages[0];

        const messageFrom = messageObj.from;
        const messageId = messageObj.id;

        if (messageObj.type === "text") {
          const messageText = messageObj.text.body.toLowerCase();
          console.log("Message Text:", messageText);

          // Handle STOP
          if (messageText === "stop") {
            // Upsert: Updates the user if they exist, creates them if they don't
            await CustomerRecord.findOneAndUpdate(
              { customerPhone: messageFrom },
              { optOut: true },
              { upsert: true, new: true },
            );

            try {
              await axios({
                method: "POST",
                url: `https://graph.facebook.com/v25.0/${phnNumberId}/messages`,
                data: {
                  messaging_product: "whatsapp",
                  to: messageFrom,
                  text: {
                    body: "It's sad to see you stopping our notifications. To resume, message us 'START' or 'CONTINUE'.",
                  },
                },
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                },
              });
              console.log("Stop reply sent successfully.");
            } catch (apiError) {
              console.log(
                "Error sending WhatsApp reply:",
                apiError.response ? apiError.response.data : apiError.message,
              );
            }
          }

          // Handle START / CONTINUE
          else if (messageText === "start" || messageText === "continue") {
            // Upsert: Updates the user if they exist, creates them if they don't
            await CustomerRecord.findOneAndUpdate(
              { customerPhone: messageFrom },
              { optOut: false },
              { upsert: true, new: true },
            );

            try {
              await axios({
                method: "POST",
                url: `https://graph.facebook.com/v25.0/${phnNumberId}/messages`,
                data: {
                  messaging_product: "whatsapp",
                  to: messageFrom,
                  text: {
                    body: "Welcome back to SLG! You can now receive notifications.",
                  },
                },
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                },
              });
              console.log("Start reply sent successfully.");
            } catch (apiError) {
              console.log(
                "Error sending WhatsApp reply:",
                apiError.response ? apiError.response.data : apiError.message,
              );
            }
          }
        }
      }

      // 5. CRITICAL: Always return 200 OK exactly once at the end
      return res.sendStatus(200);
    } else {
      return res.sendStatus(404);
    }
  } catch (error) {
    console.log("Error while processing webhook:", error);
    // Ensure we don't send a 500 if a response was already sent
    if (!res.headersSent) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};
