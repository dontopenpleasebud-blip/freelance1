const Product = require("../models/Product");
const categoryDefaults = {
  Milk: "/uploads/defaults/Milk.jpg",
  Curd: "/uploads/defaults/Curd.jpg",
  Butter: "/uploads/defaults/Butter.jpg",
  Ghee: "/uploads/defaults/Ghee.jpg",
  Paneer: "/uploads/defaults/Paneer.jpg",
  Cheese: "/uploads/defaults/Cheese.jpg",
  Cream: "/uploads/defaults/Cream.jpg",
  Lassi: "/uploads/defaults/Lassi.jpg",
  "Flavoured Milk": "/uploads/defaults/Flavoured-Milk.jpg",
  "Ice Cream": "/uploads/defaults/Ice-Cream.jpg",
  Sweets: "/uploads/defaults/Sweets.jpg",
  Spices: "/uploads/defaults/Spices.jpg",
};

// @desc    Get all products
// @route   GET /api/products/
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sortBy,
      order = "asc",
      page = 1,
      limit = 20,
      productType,
    } = req.query;

    const filter = {};

    // Product Type filter
    if (productType) {
      const typeLower = productType.toLowerCase();
      if (typeLower === "retail") {
        filter.$or = [
          { productType: "Retail" },
          { productType: "retail" },
          { productType: "Both" },
          { productType: "both" },
          { productType: { $exists: false } },
        ];
      } else if (typeLower === "wholesale") {
        filter.$or = [
          { productType: "Wholesale" },
          { productType: "wholesale" },
          { productType: "Both" },
          { productType: "both" },
        ];
      } else if (typeLower === "both") {
        filter.$or = [
          { productType: "Both" },
          { productType: "both" },
        ];
      } else {
        filter.productType = productType;
      }
    }

    // Search by name
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // Sorting
    let sort = {};

    switch (sortBy) {
      case "price":
        sort.price = order === "desc" ? -1 : 1;
        break;

      case "name":
        sort.name = order === "desc" ? -1 : 1;
        break;

      case "serialNumber":
        sort.serialNumber = order === "desc" ? -1 : 1;
        break;

      case "newest":
        sort.createdAt = -1;
        break;

      case "oldest":
        sort.createdAt = 1;
        break;

      default:
        sort.createdAt = -1;
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    const productsWithImages = products.map((product) => {
      const productObj = product.toObject();
      let price = productObj.retailPrice !== undefined ? productObj.retailPrice : (productObj.price || 0);
      if (productType) {
        const typeLower = productType.toLowerCase();
        if (typeLower === "wholesale") {
          price = productObj.wholesalePrice !== undefined ? productObj.wholesalePrice : (productObj.price || 0);
        } else if (typeLower === "retail") {
          price = productObj.retailPrice !== undefined ? productObj.retailPrice : (productObj.price || 0);
        }
      }
      return {
        ...productObj,
        price,
        image:
          productObj.image ||
          categoryDefaults[productObj.category] ||
          "/uploads/defaults/logo.jpg",
      };
    });

    res.json({
      products: productsWithImages,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Get a single product by ID
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const productObj = product.toObject();
    productObj.price = productObj.retailPrice !== undefined ? productObj.retailPrice : (productObj.price || 0);
    productObj.image =
      productObj.image ||
      categoryDefaults[productObj.category] ||
      "/uploads/defaults/logo.jpg";
    res.json(productObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new product
// @route   POST /api/products/
const createProduct = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    let {
      name,
      serialNumber,
      price,
      retailPrice,
      wholesalePrice,
      description,
      category,
      productType,
      stock,
    } = req.body;
    const image = req.file ? `/uploads/products/${req.file.filename}` : null;

    if (productType) {
      const typeLower = productType.toLowerCase();
      if (typeLower === "retail") productType = "Retail";
      else if (typeLower === "wholesale") productType = "Wholesale";
      else if (typeLower === "both") productType = "Both";
    } else {
      productType = "Retail";
    }

    if (price !== undefined && price !== "") {
      const numPrice = Number(price);
      if (productType === "Retail" && retailPrice === undefined) retailPrice = numPrice;
      if (productType === "Wholesale" && wholesalePrice === undefined) wholesalePrice = numPrice;
      if (productType === "Both") {
        if (retailPrice === undefined) retailPrice = numPrice;
        if (wholesalePrice === undefined) wholesalePrice = numPrice;
      }
    }

    const hasPrice = 
      (productType === "Retail" && (retailPrice !== undefined && retailPrice !== "")) ||
      (productType === "Wholesale" && (wholesalePrice !== undefined && wholesalePrice !== "")) ||
      (productType === "Both" && (retailPrice !== undefined && retailPrice !== "") && (wholesalePrice !== undefined && wholesalePrice !== ""));

    if (!name || !serialNumber || !category || stock === undefined || !hasPrice) {
      return res.status(400).json({
        message: "Name, serial number, category, required price fields, and stock are required",
      });
    }

    const existingProduct = await Product.findOne({ serialNumber });
    if (existingProduct) {
      return res
        .status(400)
        .json({ message: "Product with this serial number already exists" });
    }
    const product = new Product({
      name,
      serialNumber,
      retailPrice: retailPrice !== undefined ? Number(retailPrice) : 0,
      wholesalePrice: wholesalePrice !== undefined ? Number(wholesalePrice) : 0,
      description: description || "",
      category,
      image,
      productType,
      stock: Number(stock),
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    let {
      name,
      serialNumber,
      price,
      retailPrice,
      wholesalePrice,
      description,
      category,
      productType,
      stock,
    } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (productType !== undefined) {
      const typeLower = productType.toLowerCase();
      if (typeLower === "retail") product.productType = "Retail";
      else if (typeLower === "wholesale") product.productType = "Wholesale";
      else if (typeLower === "both") product.productType = "Both";
    }

    if (price !== undefined && price !== "") {
      const numPrice = Number(price);
      const currentType = product.productType;
      if (currentType === "Retail" && retailPrice === undefined) retailPrice = numPrice;
      if (currentType === "Wholesale" && wholesalePrice === undefined) wholesalePrice = numPrice;
      if (currentType === "Both") {
        if (retailPrice === undefined) retailPrice = numPrice;
        if (wholesalePrice === undefined) wholesalePrice = numPrice;
      }
    }

    if (retailPrice !== undefined) product.retailPrice = Number(retailPrice);
    if (wholesalePrice !== undefined) product.wholesalePrice = Number(wholesalePrice);
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (name) product.name = name;
    if (stock !== undefined) product.stock = Number(stock);
    if (serialNumber) {
      const existingProduct = await Product.findOne({
        serialNumber,
        _id: { $ne: req.params.id },
      });
      if (existingProduct) {
        return res.status(400).json({
          message: "Another product with this serial number already exists",
        });
      }
      product.serialNumber = serialNumber;
    }
    if (req.file) {
      product.image = `/uploads/products/${req.file.filename}`;
    }
    await product.save();
    const productObj = product.toObject();

    productObj.image =
      productObj.image ||
      categoryDefaults[productObj.category] ||
      "/uploads/defaults/logo.jpg";
    res.json(productObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    await product.deleteOne();
    res.json({ message: `${product.name} deleted` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const categoryPrefixes = {
  Milk: "MILK",
  Cheese: "CHS",
  Butter: "BTR",
  Yogurt: "YGT",
  Ghee: "GHEE",
  Paneer: "PANR",
  Cream: "CRM",
  Lassi: "LSI",
  "Flavoured Milk": "FLV",
  "Ice Cream": "ICE",
};

// @desc    Get next serial number for a category
// @route   GET /api/products/next-serial
const getNextSerialNumber = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res
        .status(400)
        .json({ message: "Category query parameter is required" });
    }

    const prefix =
      categoryPrefixes[category] || category.substring(0, 3).toUpperCase();

    // Find all products in this category
    const products = await Product.find({ category }).select("serialNumber");

    let maxNum = 0;
    const regex = new RegExp(`^${prefix}(\\d+)$`, "i");

    products.forEach((prod) => {
      if (prod.serialNumber) {
        const match = prod.serialNumber.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    const nextNum = maxNum + 1;
    const nextSerial = `${prefix}${nextNum.toString().padStart(2, "0")}`;

    res.json({ nextSerial });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getNextSerialNumber,
};
