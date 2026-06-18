const axios = require("axios");

const frontendUrl =
  process.env.CORS_ORIGIN || "http://localhost:5173";

const TEST_NUMBERS = [
  "918074200988", // your number
  "919948290585", // test number 2
  "918499095377", // test number 3
];

const FALLBACK_NUMBER = "918074200988"; // your number

const sendWhatsapp = async (
  customerNumber,
  invoiceNumber,
  totalAmount,
) => {
  try {
    if (!customerNumber) {
      console.log("⚠️ No customer number provided");
      return;
    }

    const formattedCustomer = customerNumber.startsWith("91")
      ? customerNumber
      : `91${customerNumber}`;

    const destinationNumber = TEST_NUMBERS.includes(formattedCustomer)
      ? formattedCustomer
      : FALLBACK_NUMBER;

    const billLink = `${frontendUrl}/bill/${invoiceNumber}`;

    await axios.post(
      `https://graph.facebook.com/v23.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: destinationNumber,
        type: "template",
        template: {
          name: "hello_world",
	  //name: "invoice_notification",
          language: {
            code: "en_US",
          },
          /*components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: invoiceNumber,
                },
                {
                  type: "text",
                  text: totalAmount.toString(),
                },
                {
                  type: "text",
                  text: totalAmount.toString(),
                },
                {
                  type: "text",
                  text: billLink,
                },
              ],
            },
          ],*/
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("=================================");
    console.log("✅ WhatsApp sent");
    console.log("Customer Entered:", customerNumber);
    console.log("Message Sent To:", destinationNumber);
    console.log("Invoice:", invoiceNumber);
    console.log("=================================");
  } catch (error) {
    console.log("=================================");
    console.error(
      "❌ WhatsApp Error:",
      error.response?.data || error.message,
    );
    console.log("=================================");
  }
};

module.exports = sendWhatsapp;
