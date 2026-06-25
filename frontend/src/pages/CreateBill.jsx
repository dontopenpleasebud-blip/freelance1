import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import productService from "../services/productService";
import billService from "../services/billService";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import { Skeleton } from "../components/common/Skeleton";
import {
  Search,
  ShoppingCart,
  Trash2,
  Printer,
  Plus,
  Minus,
  Milk,
  Receipt,
  UserCheck,
} from "lucide-react";

const CreateBill = ({ billType = "retail" }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // POS State
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerMail, setCustomerMail] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Catalog State
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Bill Generation Success Modal
  const [createdBill, setCreatedBill] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const categoriesList = [
    "Milk",
    "Cheese",
    "Butter",
    "Yogurt",
    "Ghee",
    "Paneer",
    "Cream",
    "Lassi",
    "Flavoured Milk",
    "Ice Cream",
    "Sweets",
    "Spices",
  ];

  const getProductImageUrl = (product) => {
    if (product && product.image && product.image.trim() !== "") {
      return `${import.meta.env.VITE_BACKEND_URI}${product.image}`;
    }
    const categoryImageMap = {
      Milk: "Milk.jpg",
      Cheese: "Cheese.jpg",
      Butter: "Butter.jpg",
      Yogurt: "Curd.jpg",
      Ghee: "Ghee.jpg",
      Paneer: "Paneer.jpg",
      Cream: "Cream.jpg",
      Lassi: "Lassi.jpg",
      "Flavoured Milk": "Flavoured-Milk.jpg",
      "Ice Cream": "Ice-Cream.jpg",
      "Sweets": "Sweets.jpg",
      "Spices": "Spices.jpg",
    };
    const filename = categoryImageMap[product.category] || "Logo.jpg";
    return `${import.meta.env.VITE_BACKEND_URI}/uploads/defaults/${filename}`;
  };

  const handleImageError = (e, category) => {
    const categoryImageMap = {
      Milk: "Milk.jpg",
      Cheese: "Cheese.jpg",
      Butter: "Butter.jpg",
      Yogurt: "Curd.jpg",
      Ghee: "Ghee.jpg",
      Paneer: "Paneer.jpg",
      Cream: "Cream.jpg",
      Lassi: "Lassi.jpg",
      "Flavoured Milk": "Flavoured-Milk.jpg",
      "Ice Cream": "Ice-Cream.jpg",
      "Sweets": "Sweets.jpg",
      "Spices": "Spices.jpg",
    };
    const filename = categoryImageMap[category] || "Logo.jpg";
    e.target.src = `${import.meta.env.VITE_BACKEND_URI}/uploads/defaults/${filename}`;
  };

  // Fetch product catalog
  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const data = await productService.getProducts({
        search: search.trim() || undefined,
        category: category || undefined,
        productType: billType,
        limit: 100, // Load all for POS selection
      });
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      showError("Failed to load product catalog.");
    } finally {
      setLoadingCatalog(false);
    }
  }, [search, category, billType, showError]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Add product to cart
  const addToCart = (product) => {
    if (product.stock === 0) {
      showWarning("This product is currently out of stock.");
      return;
    }
    setCart((prevCart) => {
      const existing = prevCart.find(
        (item) => item.product._id === product._id,
      );
      const currentQty = existing ? existing.quantity : 0;
      if (product.stock !== undefined && currentQty + 1 > product.stock) {
        showWarning(`Cannot add more. Only ${product.stock} units available in stock.`);
        return prevCart;
      }
      if (existing) {
        return prevCart.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  // Adjust quantity
  const updateQty = (productId, delta) => {
    setCart((prevCart) => {
      let isExceeded = false;
      const updated = prevCart
        .map((item) => {
          if (item.product._id === productId) {
            const newQty = item.quantity + delta;
            if (delta > 0 && item.product.stock !== undefined && newQty > item.product.stock) {
              isExceeded = true;
              return item;
            }
            return { ...item, quantity: Math.max(1, newQty) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);

      if (isExceeded) {
        const item = prevCart.find((i) => i.product._id === productId);
        showWarning(`Cannot add more. Only ${item.product.stock} units available in stock.`);
        return prevCart;
      }
      return updated;
    });
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product._id !== productId),
    );
    setCustomerMail("");
    showInfo("Product removed from cart");
  };

  // Live Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const grandTotal = subtotal;

  const handleGenerateBill = async () => {
    // Validation
    if (
      customerNumber &&
      (customerNumber.length !== 10 || !/^\d{10}$/.test(customerNumber))
    ) {
      showWarning("Customer phone number must be exactly 10 digits");
      return;
    }
    if (cart.length === 0) {
      showWarning("Your cart is empty. Add products to create a bill.");
      return;
    }

    setGenerating(true);
    try {
      const billData = {
        customerNumber,
        products: cart.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        paymentMethod,
        customerMail,
        billType,
      };

      const newBill = await billService.createBill(billData);
      showSuccess("Invoice generated successfully!");

      // Log the standalone receipt link to the console for external email operations
      console.log(
        `[INVOICE LINK] URL for billing statement: ${window.location.origin}/bill/${newBill._id}`,
      );

      setCreatedBill(newBill);
      setIsInvoiceOpen(true);

      // Clear Cart & Form on successful checkout
      setCart([]);
      setCustomerNumber("");
      setCustomerMail("");
      setPaymentMethod("cash");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to generate bill.";
      showError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pos-layout">
      {/* Left Column: Product Catalog Selector */}
      <div className="pos-catalog-panel no-print">
        <div className="pos-catalog-header">
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Milk size={20} color="var(--color-primary)" />
            <h3 style={{ fontWeight: 600, fontSize: "1rem" }}>
              Product Catalog
            </h3>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {/* Search */}
            <div
              className="search-input-wrapper"
              style={{ flexGrow: 1, minWidth: "150px" }}
            >
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                className="form-input"
                style={{ padding: "6px 8px 6px 32px" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category selection */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-input"
              style={{ width: "120px", padding: "6px" }}
            >
              <option value="">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading / Render Grid */}
        {loadingCatalog ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "12px",
              overflow: "hidden",
            }}
          >
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="catalog-item-card"
                  style={{ height: "110px" }}
                >
                  <Skeleton
                    style={{
                      height: "14px",
                      width: "80%",
                      marginBottom: "6px",
                    }}
                  />
                  <Skeleton
                    style={{
                      height: "10px",
                      width: "40%",
                      marginBottom: "12px",
                    }}
                  />
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Skeleton style={{ height: "18px", width: "40%" }} />
                    <Skeleton style={{ height: "18px", width: "30%" }} />
                  </div>
                </div>
              ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No Products Available"
            subtitle="Try adjusting your filters or search tags."
          />
        ) : (
          <div className="pos-catalog-grid">
            {products.map((product) => (
              <div
                key={product._id}
                className={`catalog-item-card ${product.stock === 0 ? "disabled" : ""}`}
                style={{
                  opacity: product.stock === 0 ? 0.6 : 1,
                  cursor: product.stock === 0 ? "not-allowed" : "pointer"
                }}
                onClick={() => addToCart(product)}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "var(--color-primary)",
                      }}
                    >
                      {product.category}
                    </span>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {product.serialNumber}
                    </span>
                  </div>

                  {/* Responsive image wrapper */}
                  <div
                    style={{
                      height: "120px",
                      width: "100%",
                      overflow: "hidden",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      background: "var(--color-bg)",
                      position: "relative",
                    }}
                  >
                    <img
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      onError={(e) => handleImageError(e, product.category)}
                      className="catalog-product-image"
                      style={{
                        height: "100%",
                        width: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  <h4
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      marginBottom: "2px",
                    }}
                  >
                    {product.name}
                  </h4>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: product.stock === 0 ? "var(--color-danger)" : product.stock < 10 ? "var(--color-warning)" : "var(--color-text-secondary)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    {product.stock === 0 ? "Out of Stock" : `Stock: ${product.stock}`}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "auto",
                    paddingTop: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    ₹{product.price.toFixed(2)}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      backgroundColor: product.stock === 0 ? "var(--color-border)" : "var(--color-primary)",
                      color: product.stock === 0 ? "var(--color-text-secondary)" : "#FFFFFF",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontWeight: 600,
                      boxShadow: product.stock === 0 ? "none" : "0 2px 4px rgba(74, 144, 226, 0.25)",
                      transition: "all var(--transition-fast) ease",
                    }}
                  >
                    {product.stock === 0 ? "Out" : "Add +"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Checkout POS Cart panel */}
      <div className="pos-cart-panel no-print">
        <div
          className="pos-cart-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShoppingCart size={20} color="var(--color-primary)" />
            <span>Billing Cart</span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => {
                setCart([]);
                showSuccess("Cart cleared");
              }}
              className="btn btn-ghost btn-sm"
              style={{
                color: "var(--color-danger)",
                display: "flex",
                gap: "4px",
                alignItems: "center",
              }}
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>

        {/* Customer number input */}
        <div className="pos-cart-customer">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label
              className="form-label"
              style={{
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <UserCheck size={14} /> Customer Number (10 Digits)
            </label>
            <input
              type="text"
              pattern="\d*"
              maxLength="10"
              placeholder="e.g. 9876543210"
              value={customerNumber}
              onChange={(e) =>
                setCustomerNumber(e.target.value.replace(/\D/g, ""))
              }
              className="form-input"
              style={{ padding: "6px 10px" }}
              disabled={generating}
            />
          </div>
          <div
            className="form-group"
            style={{ marginBottom: 0, marginTop: "8px" }}
          >
            <label
              className="form-label"
              style={{
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Receipt size={14} /> Customer Email (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. customer@example.com"
              value={customerMail}
              onChange={(e) => setCustomerMail(e.target.value)}
              className="form-input"
              style={{ padding: "6px 10px" }}
              disabled={generating}
            />
          </div>
        </div>

        {/* Cart Item rows list */}
        {cart.length === 0 ? (
          <div className="pos-cart-items" style={{ justifyContent: "center" }}>
            <EmptyState
              title="Your Cart is Empty"
              subtitle="Select products from the catalog on the left to start billing."
              icon={ShoppingCart}
            />
          </div>
        ) : (
          <div className="pos-cart-items">
            {cart.map((item) => (
              <div key={item.product._id} className="cart-item">
                <div className="cart-item-details">
                  <h5 className="cart-item-title">{item.product.name}</h5>
                  <span className="cart-item-price">
                    ₹{item.product.price.toFixed(2)} × {item.quantity}
                  </span>
                </div>

                <div className="cart-item-qty-control">
                  <button
                    onClick={() => updateQty(item.product._id, -1)}
                    className="qty-btn"
                    disabled={generating}
                  >
                    <Minus size={10} />
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    onClick={() => addToCart(item.product)}
                    className="qty-btn"
                    disabled={generating}
                  >
                    <Plus size={10} />
                  </button>
                </div>

                <div className="cart-item-total">
                  <span>
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => removeFromCart(item.product._id)}
                  className="cart-item-delete"
                  disabled={generating}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Cart Calculations and checkout options */}
        <div className="pos-cart-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {/* Payment selector */}
          <div style={{ margin: "8px 0" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Payment Mode
            </span>
            <div className="payment-method-selector">
              {["cash", "card", "online"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMethod(mode)}
                  className={`payment-btn ${paymentMethod === mode ? "active" : ""}`}
                  disabled={generating}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="summary-row total">
            <span>Total Payable</span>
            <span style={{ color: "var(--color-primary)" }}>
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleGenerateBill}
            disabled={generating || cart.length === 0}
            className="btn btn-success"
            style={{
              width: "100%",
              height: "46px",
              marginTop: "8px",
              fontWeight: 600,
            }}
          >
            {generating ? "Generating Invoice..." : "Generate & Print Invoice"}
          </button>
        </div>
      </div>

      {/* Bill Receipt Preview Modal on success */}
      <Modal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title="Invoice Generated Successfully"
        size="large"
        footer={
          <div
            style={{
              display: "flex",
              gap: "10px",
              width: "100%",
              justifyContent: "flex-end",
            }}
          >
            <button onClick={handlePrint} className="btn btn-primary">
              <Printer size={16} />
              Print Invoice Receipt
            </button>
            <button
              onClick={() => setIsInvoiceOpen(false)}
              className="btn btn-secondary"
            >
              Close POS Terminal
            </button>
          </div>
        }
      >
        {createdBill && (
          <div
            className="print-invoice-sheet"
            style={{
              padding: "10px",
              fontFamily: "var(--font-family)",
              color: "var(--color-text-primary)",
            }}
          >
            {/* Store Receipt Header */}
            <div
              style={{
                textAlign: "center",
                borderBottom: "2px solid var(--color-border)",
                paddingBottom: "16px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "8px",
                }}
              >
                <img
                  src="/logo.png"
                  alt="SRI LAKSHMI GANAPATHI MILK AND COOL DRINKS Logo"
                  style={{
                    width: "64px",
                    height: "64px",
                    objectFit: "contain",
                    borderRadius: "50%",
                  }}
                />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                SRI LAKSHMI GANAPATHI MILK AND COOL DRINKS
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                VISAKHA DAIRY 🥛 | WHOLESALE MARKET ✨ | SINCE 2005❤️
              </p>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: "1.4",
                }}
              >
                Retail & Wholesale
              </p>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-text-secondary)",
                  marginTop: "6px",
                  borderTop: "1px dashed var(--color-border)",
                  paddingTop: "6px",
                  textAlign: "center",
                }}
              >
                <strong>Branches:</strong>
                <br />
                1) Near SBI, opposite P.Gannavaram 🔥
                <br />
                2) Honda Showroom, opposite Pothavaram 😍
              </div>
            </div>

            {/* Bill Meta Data */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "20px",
                fontSize: "0.875rem",
              }}
            >
              <div>
                <p>
                  <strong>Invoice Number:</strong>{" "}
                  {createdBill.invoiceNumber || "N/A"}
                </p>
                <p>
                  <strong>Bill Type:</strong>{" "}
                  <span
                    style={{ textTransform: "capitalize", fontWeight: 600 }}
                  >
                    {createdBill.billType || billType}
                  </span>
                </p>
                <p>
                  <strong>Customer Phone:</strong> {createdBill.customerNumber}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(createdBill.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p>
                  <strong>Accountant:</strong>{" "}
                  {createdBill.accountant?.name || user.name}
                </p>
              </div>
            </div>

            {/* Invoice Products Table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.875rem",
                marginBottom: "20px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--color-text-primary)",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "6px 0" }}>Product Name</th>
                  <th style={{ padding: "6px 0", textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "6px 0", textAlign: "right" }}>
                    Unit Price
                  </th>
                  <th style={{ padding: "6px 0", textAlign: "right" }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {createdBill.products.map((item, index) => (
                  <tr
                    key={index}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={{ padding: "8px 0" }}>
                      {item.product?.name || "Dairy Item"}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "center" }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "right" }}>
                      ₹{(item.product?.price || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "right" }}>
                      ₹{((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "6px",
                fontSize: "0.875rem",
                borderTop: "2px solid var(--color-border)",
                paddingTop: "12px",
              }}
            >
              <div>
                <span>Subtotal: </span>
                <span
                  style={{
                    width: "100px",
                    display: "inline-block",
                    textAlign: "right",
                  }}
                >
                  ₹{createdBill.totalAmount.toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                <span>Grand Total: </span>
                <span
                  style={{
                    width: "120px",
                    display: "inline-block",
                    textAlign: "right",
                    color: "var(--color-primary)",
                  }}
                >
                  ₹{createdBill.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Details footer */}
            <div
              style={{
                marginTop: "24px",
                borderTop: "1px dashed var(--color-border)",
                paddingTop: "12px",
                textAlign: "center",
                fontSize: "0.8rem",
                color: "var(--color-text-secondary)",
              }}
            >
              <p>
                Payment Mode:{" "}
                <strong
                  style={{
                    textTransform: "uppercase",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {createdBill.paymentMethod}
                </strong>
              </p>
              <p style={{ marginTop: "8px" }}>
                Thank you for shopping at SRI LAKSHMI GANAPATHI MILK AND COOL DRINKS!
              </p>
              <p>Please visit us again.</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CreateBill;
