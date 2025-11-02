const User = require("../model/User");
const UserProductCount = require("../model/UserProductCount");
const Product = require("../model/Product");
const ProductCount = require("../model/ProductCount");

// ✅ ADMIN: Add new product
exports.addProduct = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Product name required" });

    const product = await Product.create({ name });
    res.status(201).json(product);
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ ADMIN + USER: Get all products with total count
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    // Aggregate total counts per product
    const counts = await ProductCount.aggregate([
      { $group: { _id: "$product", totalCount: { $sum: "$count" } } },
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id.toString()] = c.totalCount;
    });

    const response = products.map((p) => ({
      ...p.toObject(),
      totalCount: countMap[p._id.toString()] || 0,
    }));

    res.status(200).json(response);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: err.message });
  }
};

// ✅ USER: Add to product count (accumulative)
exports.addProductCount = async (req, res) => {
  try {
    const { productId, count } = req.body;
    const userId = req.user._id;

    if (!productId || typeof count !== "number" || count <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Find record for user, product, and today's date
    let record = await ProductCount.findOne({
      user: userId,
      product: productId,
      date: todayStr,
    });

    if (record) {
      record.count += count; // add to today's existing count
      await record.save();
    } else {
      record = await ProductCount.create({
        user: userId,
        product: productId,
        count,
        date: todayStr,
      });
    }

    res.status(200).json({ message: "Count updated successfully", record });
  } catch (err) {
    console.error("Error adding count:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ ADMIN: Get all users and counts for a specific product
exports.getProductCounts = async (req, res) => {
  try {
    const { productId } = req.params;
    const counts = await ProductCount.find({ product: productId })
      .populate("user", "name email")
      .populate("product", "name");

    const totalCount = counts.reduce((sum, c) => sum + c.count, 0);

    res.status(200).json({
      productId,
      totalCount,
      userCounts: counts,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching counts", error: err.message });
  }
};


// ✅ USER: Get own counts (only user’s data)
exports.getMyCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const counts = await ProductCount.find({ user: userId }).populate(
      "product",
      "name"
    );
    res.json(counts);
  } catch (err) {
    console.error("Error fetching counts:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// exports.getAllUsersWithCounts = async (req, res) => {
//    try {
//     const users = await User.find({ role: "user" }).select("-password");

//     const usersWithCounts = await Promise.all(
//       users.map(async (user) => {
//         // Get all counts for this user
//         const counts = await ProductCount.find({ user: user._id }).populate("product", "name");

//         // Calculate per-product totals
//         const products = counts.map((item) => ({
//           productId: item.product._id,
//           productName: item.product.name,
//           count: item.count,
//         }));

//         // Calculate total count for this user
//         const totalUserCount = counts.reduce((sum, item) => sum + item.count, 0);

//         return {
//           _id: user._id,
//           name: user.name,
//           email: user.email,
//           isBlocked: user.isBlocked,
//           role: user.role,
//           products,
//           totalUserCount,
//         };
//       })
//     );

//     res.json(usersWithCounts);
//   } catch (error) {
//     console.error("Error fetching users with counts:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };
exports.getAllUsersWithCounts = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");

    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        // Get all counts for this user (from ProductCount)
        const counts = await ProductCount.find({ user: user._id }).populate(
          "product",
          "name"
        );

        // Group by product
        const productMap = {};
        for (const c of counts) {
          const pid = c.product._id.toString();
          if (!productMap[pid]) {
            productMap[pid] = {
              productId: pid,
              productName: c.product.name,
              count: 0,
            };
          }
          productMap[pid].count += c.count;
        }

        const products = Object.values(productMap);

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          isBlocked: user.isBlocked,
          role: user.role,
          products,
        };
      })
    );

    res.json(usersWithCounts);
  } catch (error) {
    console.error("Error fetching users with counts:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.addUserProductCount = async (req, res) => {
  try {
    const { productId, count } = req.body;
    const userId = req.user.id;

    let record = await UserProductCount.findOne({
      user: userId,
      product: productId,
    });

    if (record) {
      record.count += Number(count);
      await record.save();
    } else {
      record = await UserProductCount.create({
        user: userId,
        product: productId,
        count,
      });
    }

    res.json({ message: "Product count updated", record });
  } catch (err) {
    console.error("Error adding user product count:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDailyProductCounts = async (req, res) => {
  try {
    const userId = req.user._id;

    const records = await ProductCount.aggregate([
      // 1️⃣ Filter by user
      { $match: { user: userId } },

      // 2️⃣ Truncate time part of date (keep only day)
      {
        $addFields: {
          day: {
            $dateTrunc: { date: "$date", unit: "day" }
          }
        }
      },

      // 3️⃣ Group by day + product
      {
        $group: {
          _id: { day: "$day", product: "$product" },
          totalCount: { $sum: "$count" }
        }
      },

      // 4️⃣ Join product details
      {
        $lookup: {
          from: "products",
          localField: "_id.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },

      // 5️⃣ Sort latest first
      { $sort: { "_id.day": -1 } },

      // 6️⃣ Format output
      {
        $project: {
          date: "$_id.day",
          productName: "$product.name",
          totalCount: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json(records);
  } catch (err) {
    console.error("Error fetching counts:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.addTapCount = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId)
      return res.status(400).json({ message: "Product required" });

    // Each mala = 108 japs
    const countToAdd = 108;

    // Find or create user's count for today
    let record = await ProductCount.findOne({
      user: userId,
      product: productId,
      date: new Date().toDateString(), // group by day
    });

    if (record) {
      record.count = (record.count || 0) + countToAdd; // ✅ Ensure number
      await record.save();
    } else {
      record = await ProductCount.create({
        user: userId,
        product: productId,
        count: countToAdd, // ✅ Always number
        date: new Date().toDateString(),
      });
    }

    // Update total count in Product model
    const product = await Product.findById(productId);
    if (product) {
      product.totalCount = (product.totalCount || 0) + countToAdd;
      await product.save();
    }

    const totalMalas = Math.floor(record.count / 108);

    res.json({
      message: "✅ Mala added successfully",
      count: record.count,
      totalMalas,
    });
  } catch (err) {
    console.error("❌ Error adding mala:", err);
    res.status(500).json({ message: "Server error" });
  }
};
