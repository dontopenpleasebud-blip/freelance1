const Bill = require("../models/Bill");
const Product = require("../models/Product");
const sendEmail = require("../utils/sendEmail");
const sendWhatsapp = require("../utils/sendWhatsapp");
const Counter = require("../models/Counter");

// Create a new bill
exports.createBill = async (req, res) => {
  try {
    let { customerNumber, customerMail, products, paymentMethod, billType } =
      req.body;
    customerMail = customerMail || null; // Set to null if not provided
    billType = billType || "retail";

    if (billType !== "retail" && billType !== "wholesale") {
      return res.status(400).json({
        message: "Invalid bill type. Must be 'retail' or 'wholesale'.",
      });
    }

    if (
      customerNumber &&
      (customerNumber.length !== 10 || !/^\d{10}$/.test(customerNumber))
    ) {
      return res.status(400).json({
        message: "Customer number must be 10 digits",
      });
    }
    if (!products || products.length === 0 || !paymentMethod) {
      return res.status(400).json({
        message: "products, and payment method are required",
      });
    }
    // Calculate total amount and keep the resolved product details for the email
    let totalAmount = 0;
    const billItems = [];
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.product}` });
      }
      const prodType = product.productType || "retail";
      if (prodType !== billType) {
        return res.status(400).json({
          message: `Product '${product.name}' is of type '${prodType}' and cannot be added to a '${billType}' bill.`,
        });
      }
      // Check stock availability
      if (product.stock !== undefined && product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }
      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;
      billItems.push({
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        lineTotal,
      });
    }
    // Generate sequential invoice number combining year and month (e.g. INV-202606-0001)
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 1-indexed
    const yearMonthStr = `${year}${month.toString().padStart(2, "0")}`;

    const prefix = billType === "wholesale" ? "INV-W" : "INV-R";

    const counterName = `${prefix}-${yearMonthStr}`;
    const counter = await Counter.findOneAndUpdate(
      { name: counterName },
      { $inc: { sequence: 1 } },
      { returnDocument: "after", upsert: true },
    );

    const sequence = counter.sequence.toString().padStart(4, "0");
    const invoiceNumber = `${prefix}-${yearMonthStr}-${sequence}`;

    const bill = new Bill({
      invoiceNumber,
      customerNumber,
      customerMail,
      accountant: req.user._id,
      products,
      totalAmount,
      paymentMethod,
      billType,
    });
    await bill.save();

    // Deduct stock for each product
    for (const item of products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Populate accountant name and product info to return full bill details
    const populatedBill = await Bill.findById(bill._id)
      .populate("accountant", "name")
      .populate("products.product", "name price productType");

    res.status(201).json(populatedBill);

    if (customerMail) {
      let frontendUrl = process.env.CORS_ORIGIN || "http://localhost:5173";
      const emailHtml = `
    <div style="margin:0 auto;max-width:640px;padding:24px;background:#F8FAFC;font-family:Arial,sans-serif;color:#1F2937;line-height:1.5;">
      <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:16px;overflow:hidden;box-shadow:0 10px 15px -3px rgba(74,144,226,0.08);">
        <div style="padding:24px 24px 20px;background:linear-gradient(135deg,#4A90E2 0%,#7ED6A7 100%);color:#FFFFFF;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">Sri Sai Dairy Parlour</p>
          <h2 style="margin:0;font-size:24px;line-height:1.2;">Invoice ${bill.invoiceNumber}</h2>
        </div>

        <div style="padding:24px;">
          <p style="margin:0 0 16px;color:#6B7280;">Thanks for shopping with us. Here is a quick summary of your order.</p>

          <table style="width:100%;margin-bottom:20px;border-collapse:collapse;border:0;">
            <tr>
              <td style="width:33.3%;padding-right:6px;border:0;vertical-align:top;">
                <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:12px 14px;">
                  <div style="font-size:12px;color:#6B7280;margin-bottom:4px;">Customer Number</div>
                  <div style="font-size:15px;font-weight:600;color:#1F2937;">${customerNumber || "-"}</div>
                </div>
              </td>
              <td style="width:33.3%;padding-left:3px;padding-right:3px;border:0;vertical-align:top;">
                <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:12px 14px;">
                  <div style="font-size:12px;color:#6B7280;margin-bottom:4px;">Bill Type</div>
                  <div style="font-size:15px;font-weight:600;color:#1F2937;text-transform:capitalize;">${billType}</div>
                </div>
              </td>
              <td style="width:33.3%;padding-left:6px;border:0;vertical-align:top;">
                <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:12px 14px;">
                  <div style="font-size:12px;color:#6B7280;margin-bottom:4px;">Payment Method</div>
                  <div style="font-size:15px;font-weight:600;color:#1F2937;">${paymentMethod.toUpperCase()}</div>
                </div>
              </td>
            </tr>
          </table>

          <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
            <thead>
              <tr style="background:#EBF3FC;color:#1F2937;text-align:left;">
                <th style="padding:12px;border-bottom:1px solid #E5E7EB;">Product</th>
                <th style="padding:12px;border-bottom:1px solid #E5E7EB;">Qty</th>
                <th style="padding:12px;border-bottom:1px solid #E5E7EB;">Price</th>
                <th style="padding:12px;border-bottom:1px solid #E5E7EB;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${billItems
                .map(
                  (item, index) => `
              <tr style="background:${index % 2 === 0 ? "#FFFFFF" : "#F8FAFC"};">
                <td style="padding:12px;border-bottom:1px solid #E5E7EB;">${item.name}</td>
                <td style="padding:12px;border-bottom:1px solid #E5E7EB;">${item.quantity}</td>
                <td style="padding:12px;border-bottom:1px solid #E5E7EB;">₹${item.price}</td>
                <td style="padding:12px;border-bottom:1px solid #E5E7EB;font-weight:600;">₹${item.lineTotal}</td>
              </tr>`,
                )
                .join("")}
            </tbody>
          </table>

          <table style="width:100%;margin-top:20px;background:#FFF9E6;border:1px solid #FFD166;border-radius:12px;border-collapse:collapse;border-spacing:0;">
            <tr>
              <td style="font-size:14px;color:#6B7280;padding:16px;border:0;vertical-align:middle;">Grand Total</td>
              <td style="font-size:20px;font-weight:bold;color:#1F2937;text-align:right;padding:16px;border:0;vertical-align:middle;">₹${totalAmount}</td>
            </tr>
          </table>

          <p style="margin:20px 0 0;font-size:14px;color:#6B7280;">
            View your bill online: <a href="${frontendUrl}/bill/${bill.invoiceNumber}" style="color:#4A90E2;">Open bill</a>
          </p>
        </div>
      </div>
    </div>
  `;

      sendEmail(customerMail, `Invoice ${bill.invoiceNumber}`, emailHtml).catch(
        (err) => {
          console.error("Failed to send email:", err);
        },
      );
    }

    // Send WhatsApp message (simulated)
    if (customerNumber) {
      sendWhatsapp(customerNumber, invoiceNumber, totalAmount).catch((err) => {
        console.error("Failed to send WhatsApp message:", err);
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all bills
exports.getBills = async (req, res) => {
  try {
    const filter = {};
    if (req.query.billType) filter.billType = req.query.billType;
    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .populate("accountant", "name")
      .populate("products.product", "name price productType");
    res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single bill by ID
exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findOne({ invoiceNumber: req.params.invoiceNumber })
      .populate("accountant", "name")
      .populate("products.product", "name price productType");
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get bills by customer Number
exports.getBillByCustomerNumber = async (req, res) => {
  try {
    if (req.params.customerNumber.length !== 10) {
      return res
        .status(400)
        .json({ message: "Customer number must be 10 digits" });
    }
    const bills = await Bill.find({ customerNumber: req.params.customerNumber })
      .populate("accountant", "name")
      .populate("products.product", "name price productType");
    if (bills.length === 0) {
      return res
        .status(404)
        .json({ message: "No bills found for this customer number" });
    }
    res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get bills by Accountant ID
exports.getBillByAccountantId = async (req, res) => {
  try {
    const filter = { accountant: req.params.accountantId };
    if (req.query.billType) filter.billType = req.query.billType;
    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .populate("accountant", "name")
      .populate("products.product", "name price productType");
    res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
