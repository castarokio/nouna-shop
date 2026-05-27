// Nouna Shop - Secure Full-Stack Node.js/Express E-Commerce Server

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const dbFilePath = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server-side active sessions token memory store
const activeAdminTokens = new Set();

// ----------------------------------------------------
// 1. Initial Database Seed Data (if db.json is missing)
// ----------------------------------------------------

const seedDatabase = {
  admin_password: "admin123",
  categories: ["All", "Lips", "Skincare", "Eyes", "Perfumes", "Accessories"],
  wilayas: [
    { code: 1, name: "1. Adrar", price: 900 },
    { code: 2, name: "2. Chlef", price: 600 },
    { code: 3, name: "3. Laghouat", price: 700 },
    { code: 4, name: "4. Oum El Bouaghi", price: 650 },
    { code: 5, name: "5. Batna", price: 600 },
    { code: 6, name: "6. Béjaïa", price: 550 },
    { code: 7, name: "7. Biskra", price: 700 },
    { code: 8, name: "8. Béchar", price: 850 },
    { code: 9, name: "9. Blida", price: 400 },
    { code: 10, name: "10. Bouira", price: 450 },
    { code: 11, name: "11. Tamanrasset", price: 1000 },
    { code: 12, name: "12. Tébessa", price: 650 },
    { code: 13, name: "13. Tlemcen", price: 600 },
    { code: 14, name: "14. Tiaret", price: 600 },
    { code: 15, name: "15. Tizi Ouzou", price: 450 },
    { code: 16, name: "16. Alger (Algiers)", price: 300 },
    { code: 17, name: "17. Djelfa", price: 600 },
    { code: 18, name: "18. Jijel", price: 550 },
    { code: 19, name: "19. Sétif", price: 500 },
    { code: 20, name: "20. Saïda", price: 650 },
    { code: 21, name: "21. Skikda", price: 550 },
    { code: 22, name: "22. Sidi Bel Abbès", price: 600 },
    { code: 23, name: "23. Annaba", price: 550 },
    { code: 24, name: "24. Guelma", price: 600 },
    { code: 25, name: "25. Constantine", price: 500 },
    { code: 26, name: "26. Médéa", price: 450 },
    { code: 27, name: "27. Mostaganem", price: 600 },
    { code: 28, name: "28. M'Sila", price: 600 },
    { code: 29, name: "29. Mascara", price: 600 },
    { code: 30, name: "30. Ouargla", price: 800 },
    { code: 31, name: "31. Oran", price: 550 },
    { code: 32, name: "32. El Bayadh", price: 750 },
    { code: 33, name: "33. Illizi", price: 1000 },
    { code: 34, name: "34. Bordj Bou Arréridj", price: 500 },
    { code: 35, name: "35. Boumerdès", price: 400 },
    { code: 36, name: "36. El Tarf", price: 600 },
    { code: 37, name: "37. Tindouf", price: 1200 },
    { code: 38, name: "38. Tissemsilt", price: 600 },
    { code: 39, name: "39. El Oued", price: 750 },
    { code: 40, name: "40. Khenchela", price: 600 },
    { code: 41, name: "41. Souk Ahras", price: 600 },
    { code: 42, name: "42. Tipaza", price: 400 },
    { code: 43, name: "43. Mila", price: 550 },
    { code: 44, name: "44. Aïn Defla", price: 500 },
    { code: 45, name: "45. Naâma", price: 750 },
    { code: 46, name: "46. Aïn Témouchent", price: 600 },
    { code: 47, name: "47. Ghardaïa", price: 750 },
    { code: 48, name: "48. Relizane", price: 600 },
    { code: 49, name: "49. El M'Ghair", price: 800 },
    { code: 50, name: "50. El Meniaa", price: 800 },
    { code: 51, name: "51. Ouled Djellal", price: 750 },
    { code: 52, name: "52. Bordj Baji Mokhtar", price: 1200 },
    { code: 53, name: "53. Béni Abbès", price: 900 },
    { code: 54, name: "54. Timimoun", price: 900 },
    { code: 55, name: "55. Touggourt", price: 800 },
    { code: 56, name: "56. Djanet", price: 1200 },
    { code: 57, name: "57. In Salah", price: 950 },
    { code: 58, name: "58. In Guezzam", price: 1200 }
  ],
  products: [
    {
      id: "p1",
      name: "Velvet Matte Lipstick (Rose Petal)",
      category: "Lips",
      price: 1800,
      discountPrice: 1200,
      stock: 12,
      description: "Indulge in our signature Velvet Matte Lipstick. A high-pigment formula that glides on smoothly, leaving a gorgeous blush-pink matte finish that lasts all day without drying your lips.",
      image: "images/lipstick.jpg",
      images: ["images/lipstick.jpg"],
      howToUse: "Apply directly to lips starting from the center and moving outwards. For a more defined look, line lips with a matching lip liner first.",
      ingredients: "Dimethicone, Octyldodecanol, Polyethylene, Polysilicone-11, Silica, Kaolin, Rose Flower Extract, Tocopheryl Acetate, Fragrance.",
      views: 24,
      sales: 142
    },
    {
      id: "p2",
      name: "Glow Radiance Serum (2% Hyaluronic)",
      category: "Skincare",
      price: 2500,
      discountPrice: 1900,
      stock: 15,
      description: "Get the ultimate dewy, hydrated skin. Formulated with 2% pure hyaluronic acid, organic rose water extracts, and vitamin B5 to plump, nourish, and lock in moisture.",
      image: "images/serum.jpg",
      images: ["images/serum.jpg"],
      howToUse: "Apply 2-3 drops to clean, dry skin in the morning and evening. Gently press into the face and neck, avoiding the eye area. Follow with your favorite moisturizer.",
      ingredients: "Water (Aqua), Hyaluronic Acid, Rose Damascena Flower Water, Panthenol (Vitamin B5), Phenoxyethanol, Ethylhexylglycerin.",
      views: 47,
      sales: 389
    },
    {
      id: "p3",
      name: "Pink Quartz Face Roller & Gua Sha Set",
      category: "Accessories",
      price: 3200,
      discountPrice: 2400,
      stock: 8,
      description: "Handcrafted from authentic Brazilian pink rose quartz. Use this beauty tool daily to reduce puffiness, promote lymphatic drainage, and relieve muscle tension in your face.",
      image: "images/gua_sha.jpg",
      images: ["images/gua_sha.jpg"],
      howToUse: "Apply a face oil or serum first. Use the larger roller for cheeks, forehead, and neck in upward/outward motions. Use the smaller roller under eyes. Use Gua Sha for deeper facial massage along the jawline and cheekbones.",
      ingredients: "100% Authentic Grade-A Brazilian Pink Rose Quartz Stone.",
      views: 19,
      sales: 98
    },
    {
      id: "p4",
      name: "Blossom Eau de Parfum (50ml)",
      category: "Perfumes",
      price: 4800,
      discountPrice: 3900,
      stock: 5,
      description: "An elegant, captivating scent combining sweet peony blossoms, Bulgarian rose, vanilla beans, and a warm hint of white musk. Perfect for daily wear or romantic evenings.",
      image: "images/perfume.jpg",
      images: ["images/perfume.jpg"],
      howToUse: "Spray onto pulse points: wrists, neck, behind the ears, and inner elbows. Do not rub the perfume into your skin, as this can break down the fragrance molecules.",
      ingredients: "Alcohol Denat., Fragrance (Parfum), Water (Aqua), Benzyl Salicylate, Linalool, Limonene, Geraniol, Citronellol.",
      views: 33,
      sales: 156
    },
    {
      id: "p5",
      name: "Hydrating Lip Oil (Sweet Cherry)",
      category: "Lips",
      price: 1200,
      discountPrice: 950,
      stock: 20,
      description: "Combine the shine of a gloss with the intense nourishment of a balm. Our Sweet Cherry Lip Oil is enriched with jojoba and cherry seed oils for non-sticky, juicy, protected lips.",
      image: "images/lip_oil.jpg",
      images: ["images/lip_oil.jpg"],
      howToUse: "Glide over bare lips or layer over your lipstick for a glassy, high-shine moisturizing barrier.",
      ingredients: "Jojoba Seed Oil, Cherry Seed Oil, Hydrogenated Polydecene, Tocopherol, Squalane, Fragrance.",
      views: 52,
      sales: 412
    },
    {
      id: "p6",
      name: "Gold Collagen Eye Patches (60 pcs)",
      category: "Skincare",
      price: 2200,
      discountPrice: 1650,
      stock: 10,
      description: "Rejuvenate tired eyes in 15 minutes! These luxury hydrogel eye patches are infused with active collagen, real gold particles, and green tea extracts to reduce dark circles and fine lines.",
      image: "images/eye_patches.jpg",
      images: ["images/eye_patches.jpg"],
      howToUse: "Use the enclosed spatula to lift patches, apply under clean dry eyes. Leave for 15-20 minutes. Discard patches and pat remaining serum into the skin.",
      ingredients: "Hydrolyzed Collagen, Colloidal Gold, Camellia Sinensis (Green Tea) Leaf Extract, Glycerin, Sodium Hyaluronate.",
      views: 15,
      sales: 275
    },
    {
      id: "p7",
      name: "Volumizing Mascara (Deep Black)",
      category: "Eyes",
      price: 1600,
      discountPrice: 1100,
      stock: 14,
      description: "Define, lift, and lengthen your lashes with our zero-clump Volumizing Mascara. Designed with a flexible hourglass brush to coat every lash for 24 hours of bold volume.",
      image: "images/mascara.jpg",
      images: ["images/mascara.jpg"],
      howToUse: "Wiggle the brush from the lash root to the tip. Layer multiple coats for high-volume drama.",
      ingredients: "Water, Carnauba Wax, Stearic Acid, Iron Oxides (CI 77499), Acrylates Copolymer, beeswax.",
      views: 29,
      sales: 219
    },
    {
      id: "p8",
      name: "Silky Satin Sleep Mask (Blush Pink)",
      category: "Accessories",
      price: 1500,
      discountPrice: 990,
      stock: 25,
      description: "Protect your skin and eyes from friction during sleep. Made from ultra-soft, hypoallergenic blush pink satin, this mask blocks out light completely for deep, luxurious beauty sleep.",
      image: "images/sleep_mask.jpg",
      images: ["images/sleep_mask.jpg"],
      howToUse: "Adjust the elastic strap to fit comfortably around your head. Place gently over eyes before sleeping.",
      ingredients: "100% High-Grade Hypoallergenic Satin Polyester.",
      views: 12,
      sales: 84
    }
  ],
  reviews: [
    { id: "rev-seed-1", productId: "p1", name: "Sarah B.", rating: 5, date: "Yesterday", text: "OMG I love the Rose Petal lipstick! The pigment is beautiful and it stays on forever! Delivery to Alger was super fast.", approved: true },
    { id: "rev-seed-2", productId: "p2", name: "Nour M.", rating: 5, date: "2 days ago", text: "The Glow Radiance Serum makes my skin look so dewy. Highly recommend Nouna Shop!", approved: true },
    { id: "rev-seed-3", productId: "p3", name: "Lina K.", rating: 4, date: "1 week ago", text: "Perfect Gua Sha set. Very high quality rose quartz. It arrived safely and well-packaged. Shipping to Oran took 2 days.", approved: true },
    { id: "rev-seed-4", productId: "p4", name: "Amel D.", rating: 5, date: "2 weeks ago", text: "My husband bought me the Blossom Perfume and it smells amazing! I get compliments on it all the time.", approved: true }
  ],
  orders: [
    {
      id: "ORD-824512",
      customer: { name: "Yasmin Cherif", phone: "0655123456", wilaya: "16. Alger (Algiers)", baladia: "Hydra" },
      items: [{ id: "p1", name: "Velvet Matte Lipstick (Rose Petal)", price: 1200, qty: 2 }],
      subtotal: 2400,
      deliveryFee: 300,
      total: 2700,
      status: "Delivered",
      date: "2026-05-26, 14:24:10"
    },
    {
      id: "ORD-190453",
      customer: { name: "Kamel Meziani", phone: "0551789456", wilaya: "31. Oran", baladia: "Bir El Djir" },
      items: [{ id: "p2", name: "Glow Radiance Serum (2% Hyaluronic)", price: 1900, qty: 1 }],
      subtotal: 1900,
      deliveryFee: 550,
      total: 2450,
      status: "Shipped",
      date: "2026-05-27, 09:12:05"
    }
  ]
};

// Database state in memory
let db = {};

// Load or Seed DB
function loadDatabase() {
  if (fs.existsSync(dbFilePath)) {
    try {
      db = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
      // Ensure key records exist
      if (!db.products) db.products = seedDatabase.products;
      if (!db.categories) db.categories = seedDatabase.categories;
      if (!db.wilayas) db.wilayas = seedDatabase.wilayas;
      if (!db.orders) db.orders = [];
      if (!db.admin_password) db.admin_password = seedDatabase.admin_password;
      if (!db.reviews || db.reviews.length === 0 || !db.reviews[0].id) {
        db.reviews = seedDatabase.reviews;
      }
      // Upgrade existing products to have images array, howToUse, and ingredients
      if (db.products) {
        db.products.forEach(p => {
          if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
            p.images = [ p.image || "images/lipstick.jpg" ];
          }
          if (!p.howToUse) {
            const seed = seedDatabase.products.find(sp => sp.id === p.id);
            p.howToUse = seed ? seed.howToUse : "Apply daily for best results.";
          }
          if (!p.ingredients) {
            const seed = seedDatabase.products.find(sp => sp.id === p.id);
            p.ingredients = seed ? seed.ingredients : "Formulated with premium beauty components.";
          }
        });
      }
      saveDatabase();
    } catch (err) {
      console.error("Error reading JSON database, resetting defaults:", err);
      db = { ...seedDatabase };
      saveDatabase();
    }
  } else {
    db = { ...seedDatabase };
    saveDatabase();
  }
}

function saveDatabase() {
  fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2), 'utf8');
}

// Initialize Database on launch
loadDatabase();

// ----------------------------------------------------
// 2. Authentication Protection Middleware
// ----------------------------------------------------

function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. Auth token required." });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (activeAdminTokens.has(token)) {
    next();
  } else {
    res.status(401).json({ error: "Access denied. Invalid or expired token." });
  }
}

// ----------------------------------------------------
// 3. Public API Routes
// ----------------------------------------------------

// GET store products
app.get('/api/products', (req, res) => {
  res.json(db.products);
});

// GET categories
app.get('/api/categories', (req, res) => {
  res.json(db.categories);
});

// GET Wilayas shipping prices
app.get('/api/wilayas', (req, res) => {
  res.json(db.wilayas);
});

// GET all approved reviews (general)
app.get('/api/reviews', (req, res) => {
  const approved = (db.reviews || []).filter(r => r.approved);
  res.json(approved);
});

// GET approved reviews for a specific product
app.get('/api/products/:id/reviews', (req, res) => {
  const productId = req.params.id;
  const productReviews = (db.reviews || []).filter(r => r.productId === productId && r.approved);
  res.json(productReviews);
});

// POST submit a review (public, default approved: false)
app.post('/api/reviews', (req, res) => {
  const { productId, name, rating, text } = req.body;
  if (!productId || !name || !rating || !text) {
    return res.status(400).json({ error: "All review fields (product, name, rating, text) are required." });
  }

  const newReview = {
    id: "rev-" + Math.floor(100000 + Math.random() * 900000),
    productId: productId,
    name: name.trim(),
    rating: Math.min(5, Math.max(1, parseInt(rating) || 5)),
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    text: text.trim(),
    approved: false
  };

  db.reviews = db.reviews || [];
  db.reviews.unshift(newReview);
  saveDatabase();

  res.status(201).json({ success: true, review: newReview });
});

// GET all pending reviews (admin protected)
app.get('/api/admin/reviews/pending', requireAdmin, (req, res) => {
  const pending = (db.reviews || []).filter(r => !r.approved);
  res.json(pending);
});

// PUT approve a review (admin protected)
app.put('/api/admin/reviews/:id/approve', requireAdmin, (req, res) => {
  const revId = req.params.id;
  db.reviews = db.reviews || [];
  const idx = db.reviews.findIndex(r => r.id === revId);
  if (idx !== -1) {
    db.reviews[idx].approved = true;
    saveDatabase();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Review not found." });
  }
});

// DELETE decline/remove a review (admin protected)
app.delete('/api/admin/reviews/:id', requireAdmin, (req, res) => {
  const revId = req.params.id;
  db.reviews = db.reviews || [];
  const initialLen = db.reviews.length;
  db.reviews = db.reviews.filter(r => r.id !== revId);
  if (db.reviews.length < initialLen) {
    saveDatabase();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Review not found." });
  }
});

// POST Client Checkout (Purchase Order)
app.post('/api/orders', (req, res) => {
  const { name, phone, wilaya, baladia, items } = req.body;
  
  // 1. Validation
  if (!name || name.trim().length < 3) {
    return res.status(400).json({ error: "Valid Customer Name is required." });
  }
  const phoneRegex = /^(0)(5|6|7|2)[0-9]{8}$/;
  if (!phone || !phoneRegex.test(phone.trim())) {
    return res.status(400).json({ error: "Valid Algerian phone number required (e.g. 0550123456)." });
  }
  if (!wilaya || !baladia || baladia.trim().length < 2) {
    return res.status(400).json({ error: "Wilaya and municipality (Baladia) destinations are required." });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Shopping cart cannot be empty." });
  }

  // 2. Fetch shipping cost *securely on server*
  const wlRecord = db.wilayas.find(w => w.name === wilaya);
  const deliveryFee = wlRecord ? wlRecord.price : 400;

  // 3. Compute items total & adjust stock *securely on server*
  let itemsSubtotal = 0;
  const verifiedItems = [];

  for (let orderItem of items) {
    const prod = db.products.find(p => p.id === orderItem.id);
    if (!prod) {
      return res.status(400).json({ error: `Product ID ${orderItem.id} not found in catalog.` });
    }
    
    // Check stock
    if (prod.stock < orderItem.qty) {
      return res.status(400).json({ error: `Sorry, not enough stock for '${prod.name}'. Only ${prod.stock} available.` });
    }

    const price = prod.discountPrice || prod.price;
    itemsSubtotal += price * orderItem.qty;
    
    verifiedItems.push({
      id: prod.id,
      name: prod.name,
      price: price,
      qty: orderItem.qty
    });
  }

  // 4. Update Product stock and sales counts on server
  for (let orderItem of items) {
    const prod = db.products.find(p => p.id === orderItem.id);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - orderItem.qty);
      prod.sales = (prod.sales || 0) + orderItem.qty;
    }
  }

  // 5. Save order
  const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
  const newOrder = {
    id: orderId,
    customer: {
      name: name.trim(),
      phone: phone.trim(),
      wilaya: wilaya,
      baladia: baladia.trim()
    },
    items: verifiedItems,
    subtotal: itemsSubtotal,
    deliveryFee: deliveryFee,
    total: itemsSubtotal + deliveryFee,
    status: 'Pending',
    date: new Date().toLocaleString()
  };

  db.orders.unshift(newOrder);
  saveDatabase();

  res.status(201).json({ success: true, order: newOrder });
});

// ----------------------------------------------------
// 4. Admin Auth Route
// ----------------------------------------------------

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const correctPassword = db.admin_password || "admin123";

  if (password === correctPassword) {
    // Generate secure randomized session token
    const token = "tok_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
    activeAdminTokens.add(token);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: "Incorrect admin credentials password." });
  }
});

// ----------------------------------------------------
// 5. Protected Admin API Routes
// ----------------------------------------------------

// GET all orders list
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  res.json(db.orders);
});

// PUT update order status
app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const ordIdx = db.orders.findIndex(o => o.id === orderId);
  if (ordIdx !== -1) {
    db.orders[ordIdx].status = status;
    saveDatabase();
    res.json({ success: true, order: db.orders[ordIdx] });
  } else {
    res.status(404).json({ error: "Order not found." });
  }
});

// DELETE remove order
app.delete('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const orderId = req.params.id;
  const initialLen = db.orders.length;
  
  db.orders = db.orders.filter(o => o.id !== orderId);
  
  if (db.orders.length < initialLen) {
    saveDatabase();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Order not found." });
  }
});

// POST Upload image file (admin protected)
app.post('/api/admin/upload', requireAdmin, (req, res) => {
  const { filename, base64Data } = req.body;
  if (!filename || !base64Data) {
    return res.status(400).json({ error: "Missing filename or base64Data." });
  }

  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 data format." });
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeFilename = Date.now() + "_" + path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = path.join(uploadDir, safeFilename);
    
    fs.writeFileSync(filePath, imageBuffer);
    
    res.json({ success: true, url: `uploads/${safeFilename}` });
  } catch (err) {
    console.error("File upload failed:", err);
    res.status(500).json({ error: "File write failed on server." });
  }
});

// POST add product
app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { name, category, stock, price, discountPrice, description, image, images, howToUse, ingredients } = req.body;
  
  if (!name || !category || !price) {
    return res.status(400).json({ error: "Missing required product details." });
  }

  const cleanImage = image ? image.trim() : (Array.isArray(images) && images.length > 0 ? images[0] : "images/lipstick.jpg");

  const newProd = {
    id: "p" + Math.floor(1000 + Math.random() * 9000),
    name: name.trim(),
    category: category,
    stock: parseInt(stock) || 0,
    price: parseInt(price) || 0,
    discountPrice: discountPrice ? parseInt(discountPrice) : null,
    description: description ? description.trim() : "",
    image: cleanImage,
    images: Array.isArray(images) && images.length > 0 ? images.map(img => img.trim()) : [cleanImage],
    howToUse: howToUse ? howToUse.trim() : "Apply daily for best results.",
    ingredients: ingredients ? ingredients.trim() : "Formulated with premium beauty components.",
    views: Math.floor(Math.random() * 30) + 10,
    sales: 0
  };

  db.products.push(newProd);
  saveDatabase();
  res.status(201).json({ success: true, product: newProd });
});

// PUT edit product
app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const prodId = req.params.id;
  const { name, category, stock, price, discountPrice, description, image, images, howToUse, ingredients } = req.body;
  
  const idx = db.products.findIndex(p => p.id === prodId);
  if (idx !== -1) {
    const cleanImage = image ? image.trim() : (Array.isArray(images) && images.length > 0 ? images[0] : db.products[idx].image);

    db.products[idx].name = name.trim();
    db.products[idx].category = category;
    db.products[idx].stock = parseInt(stock) || 0;
    db.products[idx].price = parseInt(price) || 0;
    db.products[idx].discountPrice = discountPrice ? parseInt(discountPrice) : null;
    db.products[idx].description = description ? description.trim() : "";
    db.products[idx].image = cleanImage;
    db.products[idx].images = Array.isArray(images) && images.length > 0 ? images.map(img => img.trim()) : [cleanImage];
    db.products[idx].howToUse = howToUse ? howToUse.trim() : db.products[idx].howToUse || "Apply daily for best results.";
    db.products[idx].ingredients = ingredients ? ingredients.trim() : db.products[idx].ingredients || "Formulated with premium beauty components.";
    
    saveDatabase();
    res.json({ success: true, product: db.products[idx] });
  } else {
    res.status(404).json({ error: "Product not found." });
  }
});

// DELETE remove product
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const prodId = req.params.id;
  const initialLen = db.products.length;
  
  db.products = db.products.filter(p => p.id !== prodId);
  
  if (db.products.length < initialLen) {
    saveDatabase();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Product not found." });
  }
});

// POST add category
app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Category name required." });
  }

  const cleanName = name.trim();
  if (db.categories.some(c => c.toLowerCase() === cleanName.toLowerCase())) {
    return res.status(400).json({ error: "Category already exists." });
  }

  db.categories.push(cleanName);
  saveDatabase();
  res.status(201).json({ success: true, categories: db.categories });
});

// DELETE category
app.delete('/api/admin/categories/:name', requireAdmin, (req, res) => {
  const catName = req.params.name;
  if (catName === 'All') {
    return res.status(400).json({ error: "Cannot delete 'All' filter." });
  }

  const initialLen = db.categories.length;
  db.categories = db.categories.filter(c => c !== catName);

  if (db.categories.length < initialLen) {
    saveDatabase();
    res.json({ success: true, categories: db.categories });
  } else {
    res.status(404).json({ error: "Category not found." });
  }
});

// PUT edit shipping price
app.put('/api/admin/wilayas', requireAdmin, (req, res) => {
  const { code, price } = req.body;
  
  const idx = db.wilayas.findIndex(w => w.code === parseInt(code));
  if (idx !== -1) {
    db.wilayas[idx].price = parseInt(price) || 0;
    saveDatabase();
    res.json({ success: true, wilaya: db.wilayas[idx] });
  } else {
    res.status(404).json({ error: "Wilaya code not found." });
  }
});

// GET Backup Export JSON DB
app.get('/api/admin/db/export', requireAdmin, (req, res) => {
  res.json(db);
});

// POST Backup Import JSON DB
app.post('/api/admin/db/import', requireAdmin, (req, res) => {
  const importData = req.body;
  
  if (importData.products && importData.categories && importData.wilayas && importData.orders) {
    db.products = importData.products;
    db.categories = importData.categories;
    db.wilayas = importData.wilayas;
    db.orders = importData.orders;
    if (importData.reviews) db.reviews = importData.reviews;
    if (importData.admin_password) db.admin_password = importData.admin_password;

    saveDatabase();
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid backup document schema." });
  }
});

// POST Factory Reset DB
app.post('/api/admin/db/reset', requireAdmin, (req, res) => {
  db = { ...seedDatabase };
  saveDatabase();
  res.json({ success: true });
});

// ----------------------------------------------------
// 6. Serve Frontend Static Assets
// ----------------------------------------------------

app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve storefront index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Startup Server
app.listen(PORT, () => {
  console.log(`🚀 Nouna Shop Full-Stack server running at http://localhost:${PORT}`);
});
