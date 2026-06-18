import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import productService from "../services/productService";
import billService from "../services/billService";
import userService from "../services/userService";
import { StatsSkeleton, TableSkeleton } from "../components/common/Skeleton";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import {
  Milk,
  Receipt,
  Users as UsersIcon,
  TrendingUp,
  PlusCircle,
  FileSpreadsheet,
  Search,
  Eye,
  Calendar,
  CreditCard,
  Printer,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    products: 0,
    bills: 0,
    users: 0,
    sales: 0,
    cashAmount: 0,
    cashCount: 0,
    cardAmount: 0,
    cardCount: 0,
    onlineAmount: 0,
    onlineCount: 0,
  });
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchBillQuery, setSearchBillQuery] = useState("");

  // Modal for Invoice Details Preview
  const [selectedBill, setSelectedBill] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch products count
        const prodData = await productService.getProducts({ limit: 1 });
        const productsCount = prodData.total || 0;

        let usersCount = 0;
        let billsList = [];

        if (user.role === "admin") {
          // Admin has access to get all users
          const usersData = await userService.getUsers();
          usersCount = usersData.length || 0;

          // Admin has access to get all bills
          billsList = await billService.getBills();
        } else {
          // Accountant has access to only their bills
          billsList = await billService.getBillsByAccountant(user._id);
        }

        // Calculate today's sales and payment method breakdown
        const todayStr = new Date().toDateString();
        let todaySales = 0;
        let todayBillsCount = 0;
        let cashAmount = 0;
        let cashCount = 0;
        let cardAmount = 0;
        let cardCount = 0;
        let onlineAmount = 0;
        let onlineCount = 0;

        billsList.forEach((bill) => {
          const billDate = new Date(bill.createdAt).toDateString();
          if (billDate === todayStr) {
            todaySales += bill.totalAmount;
            todayBillsCount += 1;
            if (bill.paymentMethod === "cash") {
              cashAmount += bill.totalAmount;
              cashCount += 1;
            } else if (bill.paymentMethod === "card") {
              cardAmount += bill.totalAmount;
              cardCount += 1;
            } else if (bill.paymentMethod === "online") {
              onlineAmount += bill.totalAmount;
              onlineCount += 1;
            }
          }
        });

        setStats({
          products: productsCount,
          bills: todayBillsCount,
          users: user.role === "admin" ? usersCount : "N/A",
          sales: todaySales,
          cashAmount,
          cashCount,
          cardAmount,
          cardCount,
          onlineAmount,
          onlineCount,
        });

        // Filter and set today's bills only
        const todayBills = billsList.filter((bill) => {
          return new Date(bill.createdAt).toDateString() === todayStr;
        });

        const sorted = [...todayBills].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        setRecentBills(sorted);
      } catch (err) {
        console.error("Dashboard statistics loading failed:", err);
        showError("Failed to load dashboard data. Check backend connection.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, showError]);

  const handleSearchBillsSubmit = (e) => {
    e.preventDefault();
    if (searchBillQuery.trim()) {
      navigate(`/bills?search=${searchBillQuery.trim()}`);
    }
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setIsInvoiceOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div>
        <div style={{ height: "40px", marginBottom: "20px" }}>
          <div
            className="skeleton"
            style={{ width: "220px", height: "30px", borderRadius: "8px" }}
          />
        </div>
        <StatsSkeleton count={user?.role === "admin" ? 4 : 3} />
        <div className="card-panel" style={{ marginTop: "24px" }}>
          <div className="card-panel-header">
            <div
              className="skeleton"
              style={{ width: "150px", height: "24px", borderRadius: "6px" }}
            />
          </div>
          <TableSkeleton rows={5} cols={6} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Message */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}
        >
          Welcome back, {user?.name}!
        </h1>
        <p
          style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}
        >
          Here is a quick overview of the SLG MILK DAIRYS state for today.
        </p>
      </div>

      {/* Grid Statistics Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{stats.products}</span>
          </div>
          <div className="stat-icon-container blue">
            <Milk size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">
              {user.role === "admin"
                ? "Today's Total Bills"
                : "Your Bills Created Today"}
            </span>
            <span className="stat-value">{stats.bills}</span>
          </div>
          <div className="stat-icon-container green">
            <Receipt size={24} />
          </div>
        </div>

        {user.role === "admin" && (
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Total Users</span>
              <span className="stat-value">{stats.users}</span>
            </div>
            <div className="stat-icon-container yellow">
              <UsersIcon size={24} />
            </div>
          </div>
        )}

        <div className="stat-card" style={{ display: "flex", flexDirection: "column", alignItems: "stretch", minWidth: "280px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "12px" }}>
            <div className="stat-info">
              <span className="stat-label">
                {user.role === "admin"
                  ? "Today's Total Sales"
                  : "Your Today's Sales"}
              </span>
              <span className="stat-value">
                ₹{Number(stats.sales).toFixed(2)}
              </span>
            </div>
            <div className="stat-icon-container red">
              <TrendingUp size={24} />
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: "2px" }}>Cash</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#B28800" }}>₹{Number(stats.cashAmount || 0).toFixed(2)}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>{stats.cashCount || 0} sales</div>
            </div>
            <div style={{ borderLeft: "1px solid var(--color-border)", borderRight: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: "2px" }}>Card</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-primary)" }}>₹{Number(stats.cardAmount || 0).toFixed(2)}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>{stats.cardCount || 0} sales</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: "2px" }}>Online</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-success)" }}>₹{Number(stats.onlineAmount || 0).toFixed(2)}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>{stats.onlineCount || 0} sales</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="quick-actions-panel">
        <h3 className="quick-actions-title">Quick Actions</h3>
        <div className="quick-actions-buttons">
          {user?.role === "admin" && (
            <Link to="/products/add" className="btn btn-primary">
              <PlusCircle size={18} />
              Add Product
            </Link>
          )}
          <Link to="/bills/create" className="btn btn-success">
            <CreditCard size={18} />
            Create Bill (POS Terminal)
          </Link>
          <Link to="/bills" className="btn btn-secondary">
            <FileSpreadsheet size={18} />
            View Bill Log
          </Link>
          <form
            onSubmit={handleSearchBillsSubmit}
            style={{
              display: "flex",
              gap: "8px",
              flexGrow: 1,
              maxWidth: "400px",
            }}
          >
            <div
              className="search-input-wrapper"
              style={{ flexGrow: 1, maxWidth: "100%" }}
            >
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search bills by phone..."
                className="form-input"
                value={searchBillQuery}
                onChange={(e) => setSearchBillQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-secondary"
              style={{ padding: "8px 12px" }}
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Recent Bills Panel */}
      <div className="card-panel">
        <div className="card-panel-header">
          <h3 className="card-panel-title">
            {user.role === "admin"
              ? "Today's Invoices (All Accountants)"
              : "Your Today's Invoices"}
          </h3>
          <Link to="/bills" className="btn btn-secondary btn-sm">
            View All Bills
          </Link>
        </div>

        {recentBills.length === 0 ? (
          <EmptyState
            title="No Invoices Recorded"
            subtitle="Once bills are created, they will display here."
          />
        ) : (
          <div className="table-wrapper">
            <table className="custom-table responsive-table">
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Customer Phone</th>
                  <th>Total Amount</th>
                  <th>Payment Method</th>
                  <th>Accountant</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map((bill) => (
                  <tr key={bill._id}>
                    <td
                      data-label="Invoice No."
                      style={{ fontWeight: 600, color: "var(--color-primary)" }}
                    >
                      {bill.invoiceNumber || "N/A"}
                    </td>
                    <td data-label="Customer Phone">
                      {bill.customerNumber || "-"}
                    </td>
                    <td data-label="Total Amount" style={{ fontWeight: 600 }}>
                      ₹{bill.totalAmount.toFixed(2)}
                    </td>
                    <td data-label="Payment Method">
                      <span
                        style={{
                          textTransform: "capitalize",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor:
                            bill.paymentMethod === "cash"
                              ? "var(--color-accent-light)"
                              : bill.paymentMethod === "card"
                                ? "var(--color-primary-light)"
                                : "var(--color-success-light)",
                          color:
                            bill.paymentMethod === "cash"
                              ? "#B28800"
                              : bill.paymentMethod === "card"
                                ? "var(--color-primary)"
                                : "var(--color-success)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td data-label="Accountant">
                      {bill.accountant?.name || "Deleted User"}
                    </td>
                    <td data-label="Created Date">
                      {new Date(bill.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td data-label="Actions" style={{ textAlign: "center" }}>
                      <button
                        onClick={() => handleViewBill(bill)}
                        className="btn btn-ghost btn-sm"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details Preview Modal */}
      <Modal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title="Invoice Receipt Preview"
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
              Print Receipt
            </button>
            <button
              onClick={() => setIsInvoiceOpen(false)}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedBill && (
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
                <img src="/logo.png" alt="SLG MILK DAIRYS Logo" style={{ width: "64px", height: "64px", objectFit: "contain", borderRadius: "50%" }} />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                SLG MILK DAIRYS
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                VISAKHA DAIRY 🥛 | WHOLESALE MARKET ✨ | SINCE 2000❤️
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: "1.4",
                }}
              >
                Shopping & retail | AC Handle: @manikondaswamy
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
                <strong>Branches:</strong><br />
                1) Near SBI, opposite P.Gannavaram 🔥<br />
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
                  {selectedBill.invoiceNumber || "N/A"}
                </p>
                <p>
                  <strong>Customer Phone:</strong>{" "}
                  {selectedBill.customerNumber || "-"}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(selectedBill.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p>
                  <strong>Accountant:</strong>{" "}
                  {selectedBill.accountant?.name || "Deleted User"}
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
                {selectedBill.products.map((item, index) => (
                  <tr
                    key={index}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={{ padding: "8px 0" }}>
                      {item.product?.name || "Deleted Product"}
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
                  ₹{selectedBill.totalAmount.toFixed(2)}
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
                  ₹{selectedBill.totalAmount.toFixed(2)}
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
                  {selectedBill.paymentMethod}
                </strong>
              </p>
              <p style={{ marginTop: "8px" }}>
                Thank you for shopping at SLG MILK DAIRYS!
              </p>
              <p>Please visit us again.</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
