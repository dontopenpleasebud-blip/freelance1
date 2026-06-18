import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import productService from "../services/productService";
import { CardSkeleton, TableSkeleton } from "../components/common/Skeleton";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FilterX,
} from "lucide-react";

const Products = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  // View Mode: grid or table, persisted
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("product_view_mode") || "grid";
  });

  // Products State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filters State
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const limit = 8; // items per page

  const getProductImageUrl = (product) => {
    if (product && product.image && product.image.trim() !== "") {
      return `${import.meta.env.VITE_BACKEND_URI}${product.image}`;
    }
    const categoryImageMap = {
      "Milk": "Milk.jpg",
      "Cheese": "Cheese.jpg",
      "Butter": "Butter.jpg",
      "Yogurt": "Curd.jpg",
      "Ghee": "Ghee.jpg",
      "Paneer": "Paneer.jpg",
      "Cream": "Cream.jpg",
      "Lassi": "Lassi.jpg",
      "Flavoured Milk": "Flavoured-Milk.jpg",
      "Ice Cream": "Ice-Cream.jpg"
    };
    const filename = categoryImageMap[product.category] || "Logo.jpg";
    return `${import.meta.env.VITE_BACKEND_URI}/uploads/defaults/${filename}`;
  };

  const handleImageError = (e, category) => {
    const categoryImageMap = {
      "Milk": "Milk.jpg",
      "Cheese": "Cheese.jpg",
      "Butter": "Butter.jpg",
      "Yogurt": "Curd.jpg",
      "Ghee": "Ghee.jpg",
      "Paneer": "Paneer.jpg",
      "Cream": "Cream.jpg",
      "Lassi": "Lassi.jpg",
      "Flavoured Milk": "Flavoured-Milk.jpg",
      "Ice Cream": "Ice-Cream.jpg"
    };
    const filename = categoryImageMap[category] || "Logo.jpg";
    e.target.src = `${import.meta.env.VITE_BACKEND_URI}/uploads/defaults/${filename}`;
  };

  // Delete Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    localStorage.setItem("product_view_mode", viewMode);
  }, [viewMode]);

  // Load products with query filters
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        category: category || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sortBy:
          sortBy === "name-asc" || sortBy === "name-desc"
            ? "name"
            : sortBy === "price-asc" || sortBy === "price-desc"
              ? "price"
              : sortBy === "serialNumber-asc" || sortBy === "serialNumber-desc"
                ? "serialNumber"
                : sortBy,
        order:
          sortBy === "name-desc" ||
          sortBy === "price-desc" ||
          sortBy === "serialNumber-desc"
            ? "desc"
            : "asc",
      };

      const data = await productService.getProducts(params);
      setProducts(data.products || []);
      setTotalPages(data.pages || 1);
      setTotalProducts(data.total || 0);
    } catch (err) {
      console.error(err);
      showError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [page, search, category, minPrice, maxPrice, sortBy, showError]);

  useEffect(() => {
    // Reset page to 1 when filters change to avoid paging issues
    setPage(1);
  }, [search, category, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  };

  // Open delete confirm modal
  const triggerDelete = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  // Confirm delete product
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await productService.deleteProduct(productToDelete._id);
      showSuccess(`${productToDelete.name} deleted successfully`);
      setDeleteModalOpen(false);
      setProductToDelete(null);
      // Reload products catalog
      loadProducts();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

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
  ];

  return (
    <div>
      {/* Title Header bar */}
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
            Products Catalog
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            Manage your SLG MILK DAIRYS inventory here.
          </p>
        </div>

        {user?.role === "admin" && (
          <Link to="/products/add" className="btn btn-primary">
            <Plus size={18} />
            Add New Product
          </Link>
        )}
      </div>

      {/* Control panel and filters */}
      <div
        className="card-panel"
        style={{ padding: "16px", marginBottom: "20px" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Search bar & Grid Table Toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div
              className="search-input-wrapper"
              style={{ flexGrow: 1, maxWidth: "400px" }}
            >
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search products by name or serial..."
                className="form-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setViewMode("grid")}
                className={`btn btn-secondary ${viewMode === "grid" ? "btn-primary" : ""}`}
                style={{ padding: "8px 12px" }}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`btn btn-secondary ${viewMode === "table" ? "btn-primary" : ""}`}
                style={{ padding: "8px 12px" }}
                title="Table View"
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Filters Line */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              borderTop: "1px solid var(--color-border)",
              paddingTop: "12px",
            }}
          >
            {/* Category Filter */}
            <div className="filter-group">
              <label
                className="form-label"
                style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
              >
                Category:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input"
                style={{ width: "130px", padding: "6px 8px" }}
              >
                <option value="">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="filter-group">
              <label
                className="form-label"
                style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
              >
                Price:
              </label>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="form-input"
                style={{ width: "75px", padding: "6px 8px" }}
              />
              <span style={{ color: "var(--color-text-secondary)" }}>-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="form-input"
                style={{ width: "75px", padding: "6px 8px" }}
              />
            </div>

            {/* Sorting Filter */}
            <div className="filter-group">
              <label
                className="form-label"
                style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
              >
                Sort By:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-input"
                style={{ width: "150px", padding: "6px 8px" }}
              >
                <option value="newest">Newest Added</option>
                <option value="oldest">Oldest Added</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="serialNumber-asc">Serial Number (A-Z)</option>
                <option value="serialNumber-desc">Serial Number (Z-A)</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(search ||
              category ||
              minPrice ||
              maxPrice ||
              sortBy !== "newest") && (
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
      </div>

      {/* Main product display area */}
      {loading ? (
        viewMode === "grid" ? (
          <div className="products-grid">
            {Array(limit)
              .fill(0)
              .map((_, i) => (
                <CardSkeleton key={i} />
              ))}
          </div>
        ) : (
          <div className="card-panel">
            <TableSkeleton rows={limit} cols={6} />
          </div>
        )
      ) : products.length === 0 ? (
        <EmptyState
          title="No Products Available"
          subtitle="We couldn't find any products matching those criteria. Add or edit products to see items."
        />
      ) : viewMode === "grid" ? (
        /* GRID VIEW LAYOUT */
        <div className="products-grid">
          {products.map((product) => (
            <div
              key={product._id}
              className="product-card"
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <div
                style={{
                  height: "180px",
                  overflow: "hidden",
                  borderRadius: "10px",
                  marginBottom: "12px",
                  position: "relative",
                }}
              >
                <img
                  src={getProductImageUrl(product)}
                  alt={product.name}
                  onError={(e) => handleImageError(e, product.category)}
                  className="product-card-image"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* Group all text elements together to expand and push the footer down */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  marginBottom: "16px",
                }}
              >
                <div className="product-card-header">
                  <span className="product-category-tag">
                    {product.category}
                  </span>
                  <span className="product-serial">{product.serialNumber}</span>
                </div>
                <h3 className="product-card-title">{product.name}</h3>
                <p
                  className="product-card-desc"
                  style={{ flexGrow: 1, marginBottom: 0 }}
                >
                  {product.description || "No description provided."}
                </p>
              </div>

              <div
                className="product-card-footer"
                style={{ marginTop: "auto" }}
              >
                <span className="product-card-price">
                  ₹{product.price.toFixed(2)}
                </span>

                {user?.role === "admin" && (
                  <div className="product-actions-btn-group">
                    <Link
                      to={`/products/edit/${product._id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "6px" }}
                      title="Edit Product"
                    >
                      <Edit size={14} />
                    </Link>
                    <button
                      onClick={() => triggerDelete(product)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: "6px" }}
                      title="Delete Product"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW LAYOUT */
        <div className="card-panel">
          <div className="table-wrapper">
            <table className="custom-table responsive-table">
              <thead>
                <tr>
                  <th>Serial No.</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Description</th>
                  {user?.role === "admin" && (
                    <th style={{ textAlign: "center" }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td data-label="Serial No." style={{ fontWeight: 600 }}>
                      {product.serialNumber}
                    </td>
                    <td data-label="Product Name" style={{ fontWeight: 500 }}>
                      {product.name}
                    </td>
                    <td data-label="Category">{product.category}</td>
                    <td data-label="Price" style={{ fontWeight: 600 }}>
                      ₹{product.price.toFixed(2)}
                    </td>
                    <td
                      data-label="Description"
                      style={{
                        color: "var(--color-text-secondary)",
                        maxWidth: "240px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {product.description || "No description"}
                    </td>
                    {user?.role === "admin" && (
                      <td data-label="Actions" style={{ textAlign: "center" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <Link
                            to={`/products/edit/${product._id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "6px" }}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={() => triggerDelete(product)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: "6px" }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer block */}
      {!loading && products.length > 0 && (
        <div className="pagination">
          <span className="pagination-info">
            Showing <strong>{(page - 1) * limit + 1}</strong> to{" "}
            <strong>{Math.min(page * limit, totalProducts)}</strong> of{" "}
            <strong>{totalProducts}</strong> products
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
              style={{ fontSize: "0.85rem", padding: "0 8px", fontWeight: 600 }}
            >
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="btn btn-secondary btn-sm"
              style={{ padding: "6px 8px" }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Delete Product"
        footer={
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              disabled={deleting}
              onClick={() => setDeleteModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              disabled={deleting}
              onClick={handleDeleteConfirm}
              className="btn btn-danger"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        }
      >
        {productToDelete && (
          <div>
            <p style={{ fontSize: "0.95rem" }}>
              Are you sure you want to delete the product{" "}
              <strong>"{productToDelete.name}"</strong>?
            </p>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--color-danger)",
                marginTop: "8px",
                fontWeight: 500,
              }}
            >
              Warning: This action is permanent and cannot be undone.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Products;
