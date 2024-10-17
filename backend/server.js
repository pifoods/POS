const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://syedjunaid915:tZ9LY7s4c7tf8lza@pi-foods-pos.ucw5e.mongodb.net/?retryWrites=true&w=majority&appName=Pi-foods-pos";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  cpPerKg: Number,
  spPerKg: Number,
  variants: [{ size: String, price: Number }],
  stock: Number
});

const purchaseHistorySchema = new mongoose.Schema({
  id: Number,
  itemName: String,
  quantity: Number,
  date: String,
  description: String,
  price: Number
});

const salesSchema = new mongoose.Schema({
  date: String,
  timestamp: String,
  items: [{
    id: Number,
    name: String,
    size: String,
    price: Number,
    quantity: Number,
    discount: Number,
    total: Number
  }],
  total: Number
});

const Product = mongoose.model('Product', productSchema, 'products');
const PurchaseHistory = mongoose.model('PurchaseHistory', purchaseHistorySchema, 'purchaseHistory');
const Sales = mongoose.model('Sales', salesSchema, 'sales');

app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/products', async (req, res) => {
  const newProduct = new Product(req.body);
  try {
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/purchaseHistory', async (req, res) => {
  try {
    const purchaseHistory = await PurchaseHistory.find();
    res.json(purchaseHistory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/purchaseHistory', async (req, res) => {
  const newPurchase = new PurchaseHistory(req.body);
  try {
    await newPurchase.save();
    res.status(201).json(newPurchase);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/purchaseHistory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await PurchaseHistory.findByIdAndDelete(id);
    res.json({ message: 'Purchase record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/sales', async (req, res) => {
  try {
    const sales = await Sales.find();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/sales', async (req, res) => {
  const newSale = new Sales(req.body);
  try {
    await newSale.save();
    res.status(201).json(newSale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
