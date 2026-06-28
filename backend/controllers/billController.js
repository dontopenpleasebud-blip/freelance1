const Bill = require("../models/Bill");
const Product = require("../models/Product");
const sendEmail = require("../utils/sendEmail");
const sendWhatsapp = require("../utils/sendWhatsapp");
const Counter = require("../models/Counter");
const CustomerRecord = require("../models/CustomerRecord");

const mapBillProductsPrice = (bill) => {
  if (!bill) return null;
  const billObj = bill.toObject ? bill.toObject() : bill;
  if (billObj.products && Array.isArray(billObj.products)) {
    billObj.products.forEach((item) => {
      if (item.product && typeof item.product === "object") {
        const prodType = item.product.productType || "Retail";
        item.product.price =
          billObj.billType === "wholesale"
            ? (item.product.wholesalePrice !== undefined ? item.product.wholesalePrice : (item.product.price || 0))
            : (item.product.retailPrice !== undefined ? item.product.retailPrice : (item.product.price || 0));
      }
    });
  }
  return billObj;
};

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
      const prodType = product.productType || "Retail";
      const isAllowed = 
        prodType.toLowerCase() === "both" || 
        prodType.toLowerCase() === billType.toLowerCase();

      if (!isAllowed) {
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
      const price = billType === "wholesale" ? product.wholesalePrice : product.retailPrice;
      const lineTotal = price * item.quantity;
      totalAmount += lineTotal;
      billItems.push({
        name: product.name,
        quantity: item.quantity,
        price: price,
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
    let customer = null;
    if (customerNumber) {
      customer = await CustomerRecord.findOne({
        customerPhone: customerNumber,
      });

      if (!customer) {
        customer = await CustomerRecord.create({
          customerPhone: customerNumber,
          customerEmail: customerMail,
          customerName: "Anonymous",
        });
      }

      // Update customer purchase history and loyalty points
      customer.productsHistory.push(
        ...products.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          invoiceNumber,
        })),
      );
      customer.loyaltyPoints += Math.floor(totalAmount / 100);
      if (customerMail && !customer.customerEmail) {
        customer.customerEmail = customerMail;
      }
      await customer.save();
    } else if (customerMail) {
      customer = await CustomerRecord.findOne({
        customerEmail: customerMail,
      });

      if (!customer) {
        customer = await CustomerRecord.create({
          customerEmail: customerMail,
          customerName: "Anonymous",
        });
      }

      // Update customer purchase history and loyalty points
      customer.productsHistory.push(
        ...products.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          invoiceNumber,
        })),
      );
      customer.loyaltyPoints += Math.floor(totalAmount / 100);
      await customer.save();
    }

    // Deduct stock for each product
    for (const item of products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Populate accountant name and product info to return full bill details
    const populatedBill = await Bill.findById(bill._id)
      .populate("accountant", "name")
      .populate("products.product", "name price retailPrice wholesalePrice productType");

    res.status(201).json(mapBillProductsPrice(populatedBill));

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
      .populate("products.product", "name price retailPrice wholesalePrice productType");
    res.json(bills.map(mapBillProductsPrice));
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
      .populate("products.product", "name price retailPrice wholesalePrice productType");
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.json(mapBillProductsPrice(bill));
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
      .populate("products.product", "name price retailPrice wholesalePrice productType");
    if (bills.length === 0) {
      return res
        .status(404)
        .json({ message: "No bills found for this customer number" });
    }
    res.json(bills.map(mapBillProductsPrice));
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
      .populate("products.product", "name price retailPrice wholesalePrice productType");
    res.json(bills.map(mapBillProductsPrice));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a bill
exports.updateBill = async (req, res) => {
  try {
    const { customerNumber, customerMail, products, paymentMethod, billType } =
      req.body;

    // Basic validation
    if (billType && billType !== "retail" && billType !== "wholesale") {
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

    const bill = await Bill.findOne({
      invoiceNumber: req.params.invoiceNumber,
    });
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const originalProducts = bill.products;
    const finalBillType = billType || bill.billType;

    // Temporarily restore stock for original products
    for (const item of originalProducts) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    const billItems = [];
    let totalAmount = 0;

    try {
      const targetProducts = products || originalProducts;

      for (const item of targetProducts) {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }
        const prodType = product.productType || "Retail";
        const isAllowed = 
          prodType.toLowerCase() === "both" || 
          prodType.toLowerCase() === finalBillType.toLowerCase();

        if (!isAllowed) {
          throw new Error(
            `Product '${product.name}' is of type '${prodType}' and cannot be added to a '${finalBillType}' bill.`,
          );
        }
        // Check stock availability
        if (product.stock !== undefined && product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for product '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}`,
          );
        }
        const price = finalBillType === "wholesale" ? product.wholesalePrice : product.retailPrice;
        const lineTotal = price * item.quantity;
        totalAmount += lineTotal;
        billItems.push({
          product: product._id,
          quantity: item.quantity,
        });
      }

      // Deduct the new stock
      for (const item of billItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      // 1. Revert original customer points and history from the original customer record
      if (bill.customerNumber || bill.customerMail) {
        const query = bill.customerNumber 
          ? { customerPhone: bill.customerNumber }
          : { customerEmail: bill.customerMail };
          
        const originalCustomer = await CustomerRecord.findOne(query);
        if (originalCustomer) {
          originalCustomer.productsHistory = originalCustomer.productsHistory.filter(
            (item) => item.invoiceNumber !== bill.invoiceNumber
          );
          const pointsToDeduct = Math.floor(bill.totalAmount / 100);
          originalCustomer.loyaltyPoints = Math.max(0, originalCustomer.loyaltyPoints - pointsToDeduct);
          await originalCustomer.save();
        }
      }

      // Update bill document fields
      const newCustomerNumber = customerNumber !== undefined ? customerNumber : bill.customerNumber;
      const newCustomerMail = customerMail !== undefined ? customerMail : bill.customerMail;

      if (customerNumber !== undefined) bill.customerNumber = customerNumber;
      if (customerMail !== undefined) bill.customerMail = customerMail || null;
      if (paymentMethod !== undefined) bill.paymentMethod = paymentMethod;
      bill.billType = finalBillType;
      bill.products = billItems;
      bill.totalAmount = totalAmount;

      await bill.save();

      // 2. Add points and history to the new customer record
      if (newCustomerNumber) {
        let newCustomer = await CustomerRecord.findOne({ customerPhone: newCustomerNumber });
        if (!newCustomer) {
          newCustomer = await CustomerRecord.create({
            customerPhone: newCustomerNumber,
            customerEmail: newCustomerMail || null,
            customerName: "Anonymous",
          });
        }
        newCustomer.productsHistory.push(
          ...billItems.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            invoiceNumber: bill.invoiceNumber,
          }))
        );
        newCustomer.loyaltyPoints += Math.floor(totalAmount / 100);
        if (newCustomerMail && !newCustomer.customerEmail) {
          newCustomer.customerEmail = newCustomerMail;
        }
        await newCustomer.save();
      } else if (newCustomerMail) {
        let newCustomer = await CustomerRecord.findOne({ customerEmail: newCustomerMail });
        if (!newCustomer) {
          newCustomer = await CustomerRecord.create({
            customerEmail: newCustomerMail,
            customerName: "Anonymous",
          });
        }
        newCustomer.productsHistory.push(
          ...billItems.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            invoiceNumber: bill.invoiceNumber,
          }))
        );
        newCustomer.loyaltyPoints += Math.floor(totalAmount / 100);
        await newCustomer.save();
      }

      const populatedBill = await Bill.findById(bill._id)
        .populate("accountant", "name")
        .populate("products.product", "name price retailPrice wholesalePrice productType");

      res.json(mapBillProductsPrice(populatedBill));
    } catch (error) {
      // Revert stock to original values by re-deducting them
      for (const item of originalProducts) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity },
          });
        }
      }
      return res.status(400).json({ message: error.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a bill
exports.deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      invoiceNumber: req.params.invoiceNumber,
    });
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Restore stock for all products in this bill
    for (const item of bill.products) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    // Revert products history and loyalty points from the customer record
    if (bill.customerNumber || bill.customerMail) {
      const query = bill.customerNumber 
        ? { customerPhone: bill.customerNumber }
        : { customerEmail: bill.customerMail };
        
      const customer = await CustomerRecord.findOne(query);
      if (customer) {
        customer.productsHistory = customer.productsHistory.filter(
          (item) => item.invoiceNumber !== bill.invoiceNumber
        );
        const pointsToDeduct = Math.floor(bill.totalAmount / 100);
        customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - pointsToDeduct);
        await customer.save();
      }
    }

    await Bill.deleteOne({ invoiceNumber: req.params.invoiceNumber });
    res.json({ message: "Bill deleted successfully and stock restored" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
