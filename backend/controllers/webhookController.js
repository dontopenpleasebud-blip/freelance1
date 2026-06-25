exports.verifyWebhook = async (req, res) => {
  try {
    const mode = req.query["hub.mode"];
    const challenge = req.query["hub.challenge"];
    const verifyToken = req.query["hub.verify_token"];
    console.log("mode", mode);
    console.log("challenge", challenge);
    console.log("verifyToken", verifyToken);
    if (mode === "subscribe" && verifyToken === process.env.WHATSAPP_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).json({ message: "Invalid webhook" });
    }
  } catch (error) {
    console.log("Error while verifying webhook:", error);
    res.status(500).json({ message: "Failed to verify webhook" });
  }
};
