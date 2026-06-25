const express = require("express");
const router = express.Router();
const { verifyWebhook } = require("../controllers/webhookController");

//webhook verification
router.get("/", verifyWebhook);

module.exports = router;
