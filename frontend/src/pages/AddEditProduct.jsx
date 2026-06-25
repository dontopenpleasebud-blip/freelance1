import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import productService from "../services/productService";
import { Skeleton } from "../components/common/Skeleton";
import { ArrowLeft, Save, UploadCloud } from "lucide-react";

const AddEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const isEditMode = !!id;

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    category: "",
    price: "",
    description: "",
    productType: "retail",
    stock: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  // Fetch product details for edit mode
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const product = await productService.getProductById(id);
        setFormData({
          name: product.name || "",
          serialNumber: product.serialNumber || "",
          category: product.category || "",
          price: product.price ? product.price.toString() : "",
          description: product.description || "",
          productType: product.productType || "retail",
          stock: product.stock !== undefined ? product.stock.toString() : "0",
        });
        setPreview(
          product.image
            ? `${import.meta.env.VITE_BACKEND_URI}${product.image}`
            : "",
        );
      } catch (err) {
        console.error("Error loading product:", err);
        showError("Failed to load product details.");
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      fetchProduct();
    }
  }, [id, isEditMode, navigate, showError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for that field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = "Product Name is required";
    if (!formData.serialNumber.trim())
      tempErrors.serialNumber = "Serial Number is required";
    if (!formData.category) tempErrors.category = "Please select a category";

    if (!formData.price) {
      tempErrors.price = "Price is required";
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      tempErrors.price = "Price must be a valid positive number";
    }

    if (formData.stock === "" || formData.stock === undefined || formData.stock === null) {
      tempErrors.stock = "Stock is required";
    } else if (isNaN(formData.stock) || parseInt(formData.stock, 10) < 0) {
      tempErrors.stock = "Stock must be a non-negative integer";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = new FormData();

      payload.append("name", formData.name.trim());
      payload.append(
        "serialNumber",
        formData.serialNumber.trim().toUpperCase(),
      );
      payload.append("category", formData.category);
      payload.append("price", formData.price);
      payload.append("description", formData.description.trim());
      payload.append("productType", formData.productType);
      payload.append("stock", formData.stock);

      if (image) {
        payload.append("image", image);
      }

      if (isEditMode) {
        await productService.updateProduct(id, payload);
        showSuccess("Product updated successfully!");
      } else {
        await productService.createProduct(payload);
        showSuccess("Product created successfully!");
      }
      navigate("/products");
    } catch (err) {
      console.error("Product save error details:", err);
      let errorMsg = "An error occurred while saving the product";

      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          // If the server returned an HTML error page (like from Nginx or default Express errors)
          if (err.response.data.includes("<pre>")) {
            const match = err.response.data.match(/<pre>([\s\S]*?)<\/pre>/);
            errorMsg = match ? match[1] : "Server returned HTML error details";
          } else {
            // Trim any HTML tags if present or show the first 120 characters
            const doc = new DOMParser().parseFromString(
              err.response.data,
              "text/html",
            );
            const bodyText = doc.body?.textContent?.trim() || "";
            errorMsg = bodyText
              ? bodyText.substring(0, 120)
              : "Server HTML response";
          }
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      showError(errorMsg);
    } finally {
      setSubmitting(false);
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
    "Sweets",
    "Spices",
  ];

  if (loading) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <Skeleton
            style={{ height: "32px", width: "100px", borderRadius: "8px" }}
          />
        </div>
        <div className="card-panel" style={{ padding: "24px" }}>
          <Skeleton
            style={{ height: "30px", width: "40%", marginBottom: "24px" }}
          />
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div>
              <Skeleton
                style={{ height: "14px", width: "120px", marginBottom: "6px" }}
              />
              <Skeleton style={{ height: "40px", borderRadius: "8px" }} />
            </div>
            <div>
              <Skeleton
                style={{ height: "14px", width: "120px", marginBottom: "6px" }}
              />
              <Skeleton style={{ height: "40px", borderRadius: "8px" }} />
            </div>
            <div>
              <Skeleton
                style={{ height: "14px", width: "120px", marginBottom: "6px" }}
              />
              <Skeleton style={{ height: "80px", borderRadius: "8px" }} />
            </div>
            <Skeleton
              style={{
                height: "46px",
                width: "140px",
                borderRadius: "8px",
                marginTop: "10px",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      {/* Back button */}
      <Link
        to="/products"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "20px",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "var(--color-text-secondary)",
        }}
      >
        <ArrowLeft size={16} />
        Back to Products Catalog
      </Link>

      <div className="card-panel" style={{ padding: "24px" }}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "24px",
          }}
        >
          {isEditMode ? "Edit Product Information" : "Create New Product"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Product Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Product Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Fresh Paneer (200g)"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              disabled={submitting}
            />
            {errors.name && (
              <span className="form-error-msg">{errors.name}</span>
            )}
          </div>

          {/* Row of Serial and Category */}
          <div className="form-row">
            {/* Serial Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="serialNumber">
                Serial Number / SKU Code *
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  id="serialNumber"
                  name="serialNumber"
                  type="text"
                  placeholder="e.g. PANR02"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="form-input"
                  style={{ textTransform: "uppercase" }}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!formData.category) {
                      showError("Please select a category first.");
                      return;
                    }
                    try {
                      const data = await productService.getNextSerial(
                        formData.category,
                      );
                      setFormData((prev) => ({
                        ...prev,
                        serialNumber: data.nextSerial,
                      }));
                      showSuccess(`Generated next serial: ${data.nextSerial}`);
                    } catch (err) {
                      console.error(err);
                      showError("Failed to auto-generate serial number.");
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ padding: "8px 14px", whiteSpace: "nowrap" }}
                  disabled={submitting}
                >
                  Generate
                </button>
              </div>
              {errors.serialNumber && (
                <span className="form-error-msg">{errors.serialNumber}</span>
              )}
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="category">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-input"
                disabled={submitting}
              >
                <option value="">Select Category</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <span className="form-error-msg">{errors.category}</span>
              )}
            </div>
          </div>

          {/* Row of Price and Stock */}
          <div className="form-row">
            {/* Product Price */}
            <div className="form-group">
              <label className="form-label" htmlFor="price">
                Product Price (₹) *
              </label>
              <input
                id="price"
                name="price"
                type="number"
                step="any"
                placeholder="e.g. 120.00"
                value={formData.price}
                onChange={handleChange}
                className="form-input"
                disabled={submitting}
              />
              {errors.price && (
                <span className="form-error-msg">{errors.price}</span>
              )}
            </div>

            {/* Product Stock */}
            <div className="form-group">
              <label className="form-label" htmlFor="stock">
                Stock Quantity *
              </label>
              <input
                id="stock"
                name="stock"
                type="number"
                placeholder="e.g. 100"
                value={formData.stock}
                onChange={handleChange}
                className="form-input"
                disabled={submitting}
              />
              {errors.stock && (
                <span className="form-error-msg">{errors.stock}</span>
              )}
            </div>
          </div>

          {/* Product Type (Retail / Wholesale) */}
          <div className="form-group">
            <label className="form-label" htmlFor="productType">
              Product Type *
            </label>
            <select
              id="productType"
              name="productType"
              value={formData.productType}
              onChange={handleChange}
              className="form-input"
              disabled={submitting}
            >
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Product Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Provide a brief description of the product pack sizes, fat content, or storage directions..."
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              style={{ minHeight: "100px", resize: "vertical" }}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Product Image</label>

            <div
              style={{
                border: "2px dashed var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                textAlign: "center",
                cursor: "pointer",
                background: "var(--color-bg)",
                transition: "all var(--transition-fast)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "160px",
              }}
              onClick={() =>
                document.getElementById("product-image-input").click()
              }
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--color-primary)";
                e.currentTarget.style.background = "var(--color-primary-light)";
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.background = "var(--color-bg)";
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.background = "var(--color-bg)";
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) {
                  setImage(file);
                  setPreview(URL.createObjectURL(file));
                }
              }}
            >
              <input
                id="product-image-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImage(file);
                    setPreview(URL.createObjectURL(file));
                  }
                }}
                style={{ display: "none" }}
              />

              {preview ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                  }}
                >
                  <img
                    src={preview}
                    alt="preview"
                    onError={(e) => {
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
                        Sweets: "Sweets.jpg",
                        Spices: "Spices.jpg",
                      };
                      const filename =
                        categoryImageMap[formData.category] || "Logo.jpg";
                      e.target.src = `${import.meta.env.VITE_BACKEND_URI}/uploads/defaults/${filename}`;
                    }}
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "var(--radius-sm)",
                      boxShadow: "var(--shadow-sm)",
                      border: "1px solid var(--color-border)",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById("product-image-input").click();
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "6px 12px" }}
                    >
                      Change Image
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImage(null);
                        setPreview("");
                        document.getElementById("product-image-input").value =
                          "";
                      }}
                      className="btn btn-danger btn-sm"
                      style={{ padding: "6px 12px" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <UploadCloud size={32} color="var(--color-primary)" />
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Click to upload or drag and drop
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    PNG, JPG, or WEBP (max. 5MB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "24px",
              borderTop: "1px solid var(--color-border)",
              paddingTop: "16px",
            }}
          >
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Save size={16} />
              {submitting
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Product"}
            </button>
            <Link to="/products" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProduct;
