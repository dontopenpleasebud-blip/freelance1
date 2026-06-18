import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import billService from "../services/billService";
import userService from "../services/userService";
import { TableSkeleton } from "../components/common/Skeleton";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import {
  Search,
  Calendar,
  CreditCard,
  Eye,
  Printer,
  Milk,
  FilterX,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  Users,
  History,
} from "lucide-react";

const Bills = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const location = useLocation();

  // Read optional URL search parameters (e.g. from Dashboard search action)
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const initialSearch = queryParams.get("search") || "";

  // Bills State
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to get today's date in YYYY-MM-DD local format
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Filters State
  const [search, setSearch] = useState(initialSearch);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10; // items per page

  // Admin and Accountant Specific States
  const [users, setUsers] = useState([]);
  const [selectedAccountantStatsId, setSelectedAccountantStatsId] =
    useState("");
  const [selectedAccountantFilter, setSelectedAccountantFilter] = useState("");

  // Invoice Detail Preview State
  const [selectedBill, setSelectedBill] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Load bills depending on user role
  const loadBills = useCallback(async () => {
    setLoading(true);
    try {
      let data = [];
      if (user.role === "admin") {
        data = await billService.getBills();
      } else {
        data = await billService.getBillsByAccountant(user._id);
      }
      setBills(data || []);
    } catch (err) {
      console.error(err);
      showError("Failed to fetch billing history log.");
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  // Load registered users if admin
  useEffect(() => {
    if (user.role === "admin") {
      const fetchUsers = async () => {
        try {
          const data = await userService.getUsers();
          setUsers(data || []);
        } catch (err) {
          console.error("Failed to load users for dashboard:", err);
        }
      };
      fetchUsers();
    }
  }, [user]);

  // Sync search input if URL changes
  useEffect(() => {
    const s = queryParams.get("search");
    if (s) setSearch(s);
  }, [queryParams]);

  // Group sales by accountant (admin-only computation)
  const salesByAccountant = useMemo(() => {
    if (user.role !== "admin" || !bills.length) return [];

    const map = {};

    // Initialize with all loaded users
    users.forEach((u) => {
      map[u._id] = {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        totalSales: 0,
        todaySales: 0,
        beforeSales: 0,
      };
    });

    // Populate from bills
    bills.forEach((bill) => {
      const accId = bill.accountant?._id;
      if (!accId) return;

      if (!map[accId]) {
        map[accId] = {
          id: accId,
          name: bill.accountant?.name || "Deleted User",
          email: "",
          role: "accountant",
          totalSales: 0,
          todaySales: 0,
          beforeSales: 0,
        };
      }

      const amt = bill.totalAmount || 0;
      map[accId].totalSales += amt;

      const billDateStr = new Date(bill.createdAt).toDateString();
      const todayStr = new Date().toDateString();
      if (billDateStr === todayStr) {
        map[accId].todaySales += amt;
      } else {
        map[accId].beforeSales += amt;
      }
    });

    return Object.values(map).sort((a, b) => b.todaySales - a.todaySales);
  }, [bills, users, user.role]);

  // Selected accountant details for stats tracker card
  const selectedAccountantStats = useMemo(() => {
    return (
      salesByAccountant.find((s) => s.id === selectedAccountantStatsId) || null
    );
  }, [salesByAccountant, selectedAccountantStatsId]);

  // Today's stats breakdown by payment method
  const todayStats = useMemo(() => {
    const todayStr = new Date().toDateString();
    let totalSales = 0;
    let totalBills = 0;
    let cashAmount = 0;
    let cashCount = 0;
    let cardAmount = 0;
    let cardCount = 0;
    let onlineAmount = 0;
    let onlineCount = 0;

    bills.forEach((bill) => {
      const billDate = new Date(bill.createdAt).toDateString();
      if (billDate === todayStr) {
        totalSales += bill.totalAmount;
        totalBills += 1;
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

    return {
      totalSales,
      totalBills,
      cashAmount,
      cashCount,
      cardAmount,
      cardCount,
      onlineAmount,
      onlineCount,
    };
  }, [bills]);

  // Client-side filtering
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      // 1. Phone number filter
      if (search.trim() && !bill.customerNumber.includes(search.trim())) {
        return false;
      }
      // 2. Payment method filter
      if (paymentMethod && bill.paymentMethod !== paymentMethod) {
        return false;
      }
      // 3. Day-wise date filter
      if (filterDate) {
        const bDate = new Date(bill.createdAt);
        const yyyy = bDate.getFullYear();
        const mm = String(bDate.getMonth() + 1).padStart(2, "0");
        const dd = String(bDate.getDate()).padStart(2, "0");
        const formattedBillDate = `${yyyy}-${mm}-${dd}`;
        if (formattedBillDate !== filterDate) return false;
      }
      // 4. Accountant filter
      if (
        user.role === "admin" &&
        selectedAccountantFilter &&
        bill.accountant?._id !== selectedAccountantFilter
      ) {
        return false;
      }
      return true;
    });
  }, [
    bills,
    search,
    paymentMethod,
    filterDate,
    selectedAccountantFilter,
    user.role,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, paymentMethod, filterDate, selectedAccountantFilter]);

  // Pagination slicing
  const paginatedBills = useMemo(() => {
    const startIdx = (page - 1) * limit;
    return filteredBills.slice(startIdx, startIdx + limit);
  }, [filteredBills, page, limit]);

  const totalPages = Math.ceil(filteredBills.length / limit) || 1;

  const handleClearFilters = () => {
    setSearch("");
    setPaymentMethod("");
    setFilterDate("");
    setSelectedAccountantFilter("");
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setIsInvoiceOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            Billing Log History
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {user.role === "admin"
              ? "Track and audit store invoices across all accounts."
              : "Review invoices generated by your account."}
          </p>
        </div>

        <Link to="/bills/create" className="btn btn-success">
          <Plus size={18} />
          Create POS Bill
        </Link>
      </div>

      {/* Admin Insights Panel */}
      {user.role === "admin" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          {/* Card 1: Accountant Performance Tracker */}
          <div
            className="card-panel"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <User size={20} color="var(--color-primary)" />
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                Accountant Sales Tracker
              </h3>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                className="form-label"
                style={{
                  marginBottom: "6px",
                  fontSize: "0.8rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                Select Accountant
              </label>
              <select
                value={selectedAccountantStatsId}
                onChange={(e) => setSelectedAccountantStatsId(e.target.value)}
                className="form-input"
                style={{ padding: "8px 12px" }}
              >
                <option value="">-- Choose Accountant --</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {selectedAccountantStats ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginTop: "auto",
                }}
              >
                <div
                  style={{
                    background: "var(--color-success-light)",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-success)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Today's Sales
                  </span>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      marginTop: "4px",
                    }}
                  >
                    ₹{selectedAccountantStats.todaySales.toFixed(2)}
                  </div>
                </div>
                <div
                  style={{
                    background: "var(--color-primary-light)",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(74, 144, 226, 0.2)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-primary)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Before Days
                  </span>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      marginTop: "4px",
                    }}
                  >
                    ₹{selectedAccountantStats.beforeSales.toFixed(2)}
                  </div>
                </div>
                <div
                  style={{
                    gridColumn: "span 2",
                    background: "var(--color-bg)",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    Total Cumulative Sales
                  </span>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      marginTop: "2px",
                    }}
                  >
                    ₹{selectedAccountantStats.totalSales.toFixed(2)}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flexGrow: 1,
                  padding: "20px",
                  background: "var(--color-bg)",
                  borderRadius: "8px",
                  border: "1px dashed var(--color-border)",
                  minHeight: "135px",
                }}
              >
                <History
                  size={24}
                  color="var(--color-text-secondary)"
                  style={{ marginBottom: "8px" }}
                />
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--color-text-secondary)",
                    textAlign: "center",
                  }}
                >
                  Select an accountant above to track their daily & historic
                  sales performance.
                </span>
              </div>
            )}
          </div>

          {/* Card 2: Sales Summary for All Accountants */}
          <div
            className="card-panel"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <Users size={20} color="var(--color-primary)" />
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                Today's Sales by Accountant
              </h3>
            </div>

            <div
              style={{
                flexGrow: 1,
                overflowY: "auto",
                maxHeight: "180px",
                marginBottom: "12px",
                paddingRight: "4px",
              }}
            >
              {salesByAccountant.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "var(--color-text-secondary)",
                    fontSize: "0.875rem",
                  }}
                >
                  No accountant sales data found.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        textAlign: "left",
                        fontSize: "0.75rem",
                      }}
                    >
                      <th
                        style={{
                          paddingBottom: "8px",
                          color: "var(--color-text-secondary)",
                          fontWeight: 600,
                        }}
                      >
                        Name
                      </th>
                      <th
                        style={{
                          paddingBottom: "8px",
                          color: "var(--color-text-secondary)",
                          fontWeight: 600,
                          textAlign: "right",
                        }}
                      >
                        Today's Sales
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByAccountant.map((acc) => (
                      <tr
                        key={acc.id}
                        style={{ borderBottom: "1px solid rgba(0,0,0,0.02)" }}
                      >
                        <td
                          style={{
                            padding: "8px 0",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                          }}
                        >
                          {acc.name}
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--color-text-secondary)",
                              display: "block",
                            }}
                          >
                            {acc.role}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "8px 0",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            textAlign: "right",
                          }}
                        >
                          ₹{acc.todaySales.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div
              style={{
                marginTop: "auto",
                borderTop: "1px solid var(--color-border)",
                paddingTop: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                }}
              >
                Grand Total Today:
              </span>
              <span
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                }}
              >
                ₹
                {salesByAccountant
                  .reduce((sum, item) => sum + item.todaySales, 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>

          {/* Card 3: Today's Payment Method Breakdown */}
          <div
            className="card-panel"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <CreditCard size={20} color="var(--color-primary)" />
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                Today's Sales Breakdown
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', flexGrow: 1, alignItems: 'center' }}>
              <div
                style={{
                  background: "var(--color-accent-light)",
                  padding: "16px 12px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 209, 102, 0.3)",
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "#B28800", fontWeight: 700, textTransform: "uppercase" }}>Cash</span>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>
                  ₹{todayStats.cashAmount.toFixed(2)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px", fontWeight: 500 }}>
                  {todayStats.cashCount} sales
                </div>
              </div>

              <div
                style={{
                  background: "var(--color-primary-light)",
                  padding: "16px 12px",
                  borderRadius: "12px",
                  border: "1px solid rgba(74, 144, 226, 0.3)",
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 700, textTransform: "uppercase" }}>Card</span>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>
                  ₹{todayStats.cardAmount.toFixed(2)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px", fontWeight: 500 }}>
                  {todayStats.cardCount} sales
                </div>
              </div>

              <div
                style={{
                  background: "var(--color-success-light)",
                  padding: "16px 12px",
                  borderRadius: "12px",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "var(--color-success)", fontWeight: 700, textTransform: "uppercase" }}>Online</span>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>
                  ₹{todayStats.onlineAmount.toFixed(2)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px", fontWeight: 500 }}>
                  {todayStats.onlineCount} sales
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                borderTop: "1px solid var(--color-border)",
                paddingTop: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                Total Sales Today:
              </span>
              <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-primary)" }}>
                ₹{todayStats.totalSales.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Accountant Insights Panel */}
      {user.role !== "admin" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          {/* Card 3: Today's Payment Method Breakdown */}
          <div
            className="card-panel"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <CreditCard size={20} color="var(--color-primary)" />
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                Your Today's Sales Breakdown
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', flexGrow: 1, alignItems: 'center' }}>
              <div
                style={{
                  background: "var(--color-accent-light)",
                  padding: "16px 12px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 209, 102, 0.3)",
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "#B28800", fontWeight: 700, textTransform: "uppercase" }}>Cash</span>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>
                  ₹{todayStats.cashAmount.toFixed(2)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px", fontWeight: 500 }}>
                  {todayStats.cashCount} sales
                </div>
              </div>

              <div
                style={{
                  background: "var(--color-primary-light)",
                  padding: "16px 12px",
                  borderRadius: "12px",
                  border: "1px solid rgba(74, 144, 226, 0.3)",
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 700, textTransform: "uppercase" }}>Card</span>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>
                  ₹{todayStats.cardAmount.toFixed(2)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px", fontWeight: 500 }}>
                  {todayStats.cardCount} sales
                </div>
              </div>

              <div
                style={{
                  background: "var(--color-success-light)",
                  padding: "16px 12px",
                  borderRadius: "12px",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "var(--color-success)", fontWeight: 700, textTransform: "uppercase" }}>Online</span>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>
                  ₹{todayStats.onlineAmount.toFixed(2)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px", fontWeight: 500 }}>
                  {todayStats.onlineCount} sales
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                borderTop: "1px solid var(--color-border)",
                paddingTop: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                Total Sales Today:
              </span>
              <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-primary)" }}>
                ₹{todayStats.totalSales.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filtering controls */}
      <div
        className="card-panel"
        style={{ padding: "16px", marginBottom: "20px" }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
          }}
        >
          {/* Customer Phone Search */}
          <div
            className="search-input-wrapper"
            style={{ flexGrow: 1, maxWidth: "260px" }}
          >
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search by customer phone..."
              className="form-input"
              style={{ padding: "6px 8px 6px 32px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value.replace(/\D/g, ""))}
              maxLength={10}
            />
          </div>

          {/* Payment Method Selector */}
          <div className="filter-group">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="form-input"
              style={{ width: "140px", padding: "6px" }}
            >
              <option value="">All Payments</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="online">Online</option>
            </select>
          </div>

          {/* Accountant Filter Dropdown (Admin Only) */}
          {user.role === "admin" && (
            <div className="filter-group">
              <select
                value={selectedAccountantFilter}
                onChange={(e) => setSelectedAccountantFilter(e.target.value)}
                className="form-input"
                style={{ width: "160px", padding: "6px" }}
              >
                <option value="">All Accountants</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Day-wise Date Filter */}
          <div
            className="filter-group"
            style={{ display: "flex", gap: "6px", alignItems: "center" }}
          >
            <Calendar size={14} color="var(--color-text-secondary)" />
            <input
              type="date"
              className="form-input"
              style={{ width: "150px", padding: "6px" }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              title="Select Date"
            />
          </div>

          {/* Clear Filters Button */}
          {(search ||
            paymentMethod ||
            filterDate ||
            selectedAccountantFilter) && (
            <button
              onClick={handleClearFilters}
              className="btn btn-secondary btn-sm"
              style={{
                display: "flex",
                gap: "4px",
                padding: "6px 12px",
                marginLeft: "auto",
              }}
            >
              <FilterX size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Table area */}
      {loading ? (
        <div className="card-panel">
          <TableSkeleton rows={limit} cols={7} />
        </div>
      ) : filteredBills.length === 0 ? (
        <EmptyState
          title="No Invoices Found"
          subtitle="No receipts match those query limits."
        />
      ) : (
        <div className="card-panel">
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
                {paginatedBills.map((bill) => (
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

          {/* Table Pagination */}
          <div className="pagination">
            <span className="pagination-info">
              Showing <strong>{(page - 1) * limit + 1}</strong> to{" "}
              <strong>{Math.min(page * limit, filteredBills.length)}</strong> of{" "}
              <strong>{filteredBills.length}</strong> invoices
            </span>

            <div className="pagination-controls">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="btn btn-secondary btn-sm"
                style={{ padding: "6px 8px" }}
              >
                <ChevronLeft size={16} />
              </button>
              <span
                style={{
                  fontSize: "0.85rem",
                  padding: "0 8px",
                  fontWeight: 600,
                }}
              >
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
                className="btn btn-secondary btn-sm"
                style={{ padding: "6px 8px" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

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
                  fontSize: "0.85rem",
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
                  <strong>Customer Phone:</strong> {selectedBill.customerNumber}
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

export default Bills;
