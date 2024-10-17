import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Table, Form, Tab, Nav } from 'react-bootstrap';
import { ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

Chart.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, BarElement);
Chart.register(...registerables);

const App = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [sales, setSales] = useState([]);
  const [quantity, setQuantity] = useState({});
  const [discount, setDiscount] = useState({});
  const [saleDate, setSaleDate] = useState(new Date().toLocaleDateString());
  const [isCurrentDay, setIsCurrentDay] = useState(true);
  const [profits, setProfits] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T'));
  const [newStock, setNewStock] = useState({ itemName: '', quantity: '', date: '', price: '', description: '' });
  const [pricePerKg, setPricePerKg] = useState(250);
  const [selectedItem, setSelectedItem] = useState("");
  const [isOthersSelected, setIsOthersSelected] = useState(false);
  const [grandTotalProfit, setGrandTotalProfit] = useState(0);
  const [newProduct, setNewProduct] = useState({ name: '', cpPerKg: '', spPerKg: '', variants: [{ size: '', price: '' }] });
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/products')
      .then(response => response.json())
      .then(data => setProducts(data));
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/purchaseHistory')
      .then(response => response.json())
      .then(data => setPurchaseHistory(data));
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/sales')
      .then(response => response.json())
      .then(data => setSales(data));
  }, []);

  const handleQuantityChange = (productId, value) => {
    setQuantity({ ...quantity, [productId]: value });
  };

  const handleDiscountChange = (productId, variantSize, value) => {
    setDiscount({ ...discount, [productId]: { ...discount[productId], [variantSize]: value } });
  };

  const handleDeleteRecord = (index) => {
    const recordToDelete = purchaseHistory[index];
    fetch(`http://localhost:5000/purchaseHistory/${recordToDelete._id}`, {
      method: 'DELETE'
    })
    .then(() => {
      const updatedHistory = purchaseHistory.filter((_, i) => i !== index);
      setPurchaseHistory(updatedHistory);
    });
  };

  const handleItemChange = (e) => {
    const value = e.target.value;
    setSelectedItem(value);
    setIsOthersSelected(value === "Others");
    setQuantity("");
  };

  const handleAddToPurchaseHistory = () => {
    const currentItem = isOthersSelected ? { name: "Others", price: pricePerKg } : { name: selectedItem, price: pricePerKg };
    const currentQuantity = isOthersSelected ? 1 : quantity;
    const newHistoryEntry = {
      itemName: currentItem.name,
      quantity: currentQuantity,
      pricePerKg: pricePerKg,
      totalPrice: pricePerKg
    };
    setPurchaseHistory([...purchaseHistory, newHistoryEntry]);
  };

  const resetSales = () => {
    setSales([]);
    setCart([]);
  };

  const addToCart = (product) => {
    const selectedVariant = product.variants.find(variant => variant.size === quantity[product._id]);
    const sizeInKg = parseFloat(selectedVariant.size) / 1000; // Convert size to kg
    const remainingStock = product.stock - sizeInKg;
    if (remainingStock < 0) {
      alert(`${product.name} is out of stock!`);
      return;
    }
    const existingProduct = cart.find((item) => item._id === product._id && item.size === selectedVariant.size);
    if (existingProduct) {
      setCart(cart.map((item) =>
        item._id === product._id && item.size === selectedVariant.size
          ? { ...existingProduct, quantity: existingProduct.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, size: selectedVariant.size, price: selectedVariant.price, quantity: 1 }]);
    }
    const updatedProducts = products.map(p =>
      p._id === product._id ? { ...p, stock: remainingStock } : p
    );
    setProducts(updatedProducts);

    // Update stock in the database
    fetch(`http://localhost:5000/products/${product._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...product, stock: remainingStock })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Stock updated in database:', data);
    });
  };

  const handleRemoveFromCart = (indexToRemove) => {
    const itemToRemove = cart[indexToRemove];
    const sizeInKg = parseFloat(itemToRemove.size) / 1000; // Convert size to kg
    const updatedProducts = products.map(product =>
      product._id === itemToRemove._id ? { ...product, stock: product.stock + sizeInKg * itemToRemove.quantity } : product
    );
    setProducts(updatedProducts);
    const updatedCart = cart.filter((_, index) => index !== indexToRemove);
    setCart(updatedCart);

    // Update stock in the database
    fetch(`http://localhost:5000/products/${itemToRemove._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...itemToRemove, stock: itemToRemove.stock + sizeInKg * itemToRemove.quantity })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Stock updated in database:', data);
    });
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTotalWithDiscount = () => {
    return cart.reduce((total, item) => {
      const itemDiscount = discount[item._id]?.[item.size] || 0;
      return total + (item.price - itemDiscount) * item.quantity;
    }, 0);
  };

  const resetDropdowns = () => {
    setQuantity({});
  };

  const recordSales = () => {
    const timestamp = new Date().toLocaleTimeString();
    const dailySales = {
      date: saleDate,
      timestamp: timestamp,
      items: cart.map(item => ({
        ...item,
        discount: discount[item._id]?.[item.size] || 0,
        total: (item.price - (discount[item._id]?.[item.size] || 0)) * item.quantity
      })),
      total: calculateTotalWithDiscount(),
    };

    fetch('http://localhost:5000/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dailySales)
    })
    .then(response => response.json())
    .then(data => {
      setSales([...sales, data]);
      setCart([]);
      resetDropdowns();
    });
  };

  const calculateProfits = () => {
    let grandTotalProfit = 0;
    const profitData = products.map(product => {
      const profitBySize = product.variants.map(variant => {
        const sizeInKg = parseFloat(variant.size) / 1000; // Convert size to kg
        const sellingPrice = variant.price;
        const discountValue = discount[product._id]?.[variant.size] || 0;
        const costPrice = (product.cpPerKg || 0) * sizeInKg;
        const quantitySold = sales.filter(sale => sale.items.some(item => item._id === product._id && item.size === variant.size))
          .reduce((sum, sale) => sum + sale.items.filter(item => item._id === product._id && item.size === variant.size).reduce((s, item) => s + item.quantity, 0), 0) || 0;
        const profit = ((sellingPrice - discountValue) - costPrice) * quantitySold;
        return profit;
      });
      const totalProfit = profitBySize.reduce((sum, profit) => sum + profit, 0);
      grandTotalProfit += totalProfit;
      return {
        name: product.name,
        profit: totalProfit.toFixed(2),
      };
    });
    setProfits(profitData);
    setGrandTotalProfit(grandTotalProfit.toFixed(2));
  };

  const calculateTotalNetProfit = () => {
    const totalPurchaseCost = purchaseHistory.reduce((total, purchase) => total + (purchase.price * (purchase.quantity || 1)), 0);
    return (grandTotalProfit - totalPurchaseCost).toFixed(2);
  };

  useEffect(() => {
    calculateProfits();
  }, [sales, products]);

  const handleSaleDateChange = (event) => {
    setSaleDate(event.target.value);
    setSelectedDate(event.target.value);
  };

  const handleRadioChange = (event) => {
    setIsCurrentDay(event.target.value === 'current');
    if (event.target.value === 'current') {
      setSaleDate(new Date().toLocaleDateString());
    }
  };

  const handleNewStockChange = (e) => {
    const { name, value } = e.target;
    setNewStock(prevState => {
      const updatedStock = { ...prevState, [name]: value };
      return updatedStock;
    });
  };

  const handleAddStock = () => {
    const newPurchase = {
      id: Date.now(),
      itemName: newStock.itemName,
      quantity: parseFloat(newStock.quantity),
      date: newStock.date,
      description: newStock.description,
      price: pricePerKg,
    };

    fetch('http://localhost:5000/purchaseHistory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPurchase)
    })
    .then(response => response.json())
    .then(data => {
      setPurchaseHistory([...purchaseHistory, data]);

      // Update the stock in the products collection
      const updatedProducts = products.map(product => {
        if (product.name === newStock.itemName) {
          const updatedStock = product.stock + parseFloat(newStock.quantity);
          fetch(`http://localhost:5000/products/${product._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...product, stock: updatedStock })
          })
          .then(response => response.json())
          .then(updatedProduct => {
            setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));
          });
        }
        return product;
      });

      setNewStock({ itemName: '', quantity: '', date: '', price: '', description: '' });
    });
  };

  const deleteProduct = (id) => {
    fetch(`http://localhost:5000/products/${id}`, {
      method: 'DELETE'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(() => {
      const updatedProducts = products.filter(product => product._id !== id);
      setProducts(updatedProducts);
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
  };

  const handleAddProduct = () => {
    const newProductData = {
      id: Date.now(),
      name: newProduct.name,
      cpPerKg: newProduct.cpPerKg,
      spPerKg: newProduct.spPerKg,
      variants: newProduct.variants,
      stock: 0
    };

    fetch('http://localhost:5000/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newProductData)
    })
    .then(response => response.json())
    .then(data => {
      setProducts([...products, data]);
      setNewProduct({ name: '', cpPerKg: '', spPerKg: '', variants: [{ size: '', price: '' }] });
    });
  };

  const calculateSalesTotal = () => {
    return sales.reduce((total, sale) => total + sale.total, 0).toFixed(2);
  };

  const generateInvoice = () => {
    const invoiceNumber = `INV${Math.floor(100000 + Math.random() * 900000)}`;
    const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Invoice'],
      [],
      [],
      [],
      ['Pi Foods Chutney Powder', '', '', '', '', '', invoiceNumber],
      ['Junaid Iqbal'],
      ['No.19, 6th Cross, Rashad Nagar', '', '', '', '', '', 'DATE:'],
      ['Bengaluru'],
      ['Phone no. 9535817784', '', '', '', '', '', new Date().toLocaleDateString()],
      ['560045'],
      [],
      [],
      ['ITEMS', '', 'QUANTITY', 'PRICE', 'DISCOUNT', 'AMOUNT'],
    ]);
    sales.forEach((sale, saleIndex) => {
      sale.items.forEach((item, itemIndex) => {
        const row = 13 + saleIndex + itemIndex;
        XLSX.utils.sheet_add_aoa(worksheet, [[
          `${item.name} (${item.size})`,
          '',
          item.quantity,
          `₹${Number(item.price).toFixed(2)}`,
          `₹${Number(item.discount || 0).toFixed(2)}`,
          `₹${Number(item.price * item.quantity - (item.discount || 0)).toFixed(2)}`
        ]], { origin: `A${row}` });
      });
    });
    const totalRow = 13 + sales.reduce((sum, sale) => sum + sale.items.length, 0);
    XLSX.utils.sheet_add_aoa(worksheet, [
      ['NOTES:', '', '', '', '', 'TOTAL', `₹${Number(totalAmount).toFixed(2)}`],
      ['Thank You! Visit Again'],
    ], { origin: `A${totalRow}` });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 102, 204);
    doc.text('Invoice', 14, 20);
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 102, 204);
    doc.line(14, 22, 200, 22);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Pi Foods Chutney Powder', 14, 28);
    doc.text('Junaid Iqbal', 14, 33);
    doc.text('No.19, 6th Cross, Rashad Nagar', 14, 38);
    doc.text('Bengaluru', 14, 43);
    doc.text('Phone no. 9535817784', 14, 48);
    doc.text('560045', 14, 53);
    doc.setTextColor(0, 102, 204);
    doc.text(invoiceNumber, 200, 28, { align: 'right' });
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, 200, 38, { align: 'right' });
    doc.text(`DUE DATE: ${new Date().toLocaleDateString()}`, 200, 48, { align: 'right' });
    const tableData = sales.flatMap(sale => sale.items.map(item => [
      `${item.name} (${item.size})`,
      '',
      item.quantity,
      `₹${Number(item.price).toFixed(2)}`,
      `₹${Number(item.discount || 0).toFixed(2)}`,
      `₹${Number(item.price * item.quantity - (item.discount || 0)).toFixed(2)}`
    ]));
    doc.autoTable({
      head: [['ITEMS', '', 'QUANTITY', 'PRICE', 'DISCOUNT', 'AMOUNT']],
      body: tableData,
      startY: 60,
      styles: { fontSize: 12 },
      headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });
    doc.setTextColor(0, 0, 0);
    doc.text(`NOTES:`, 14, doc.autoTable.previous.finalY + 10);
    doc.setTextColor(0, 102, 204);
    doc.text(`TOTAL: ₹${Number(totalAmount).toFixed(2)}`, 200, doc.autoTable.previous.finalY + 10, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    doc.text('Thank You! Visit Again', 14, doc.autoTable.previous.finalY + 20);
    doc.save(`invoice_${new Date().toLocaleDateString()}.pdf`);
  };

  const calculatePurchaseTotal = () => {
    return purchaseHistory.reduce((total, purchase) => total + (purchase.price * (purchase.quantity || 1)), 0).toFixed(2);
  };

  const chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FFCD56', '#4BC0C0', '#36A2EB', '#FF6384',
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FFCD56', '#4BC0C0', '#36A2EB', '#FF6384'
  ];
  const calculateWeeklyExpenses = () => {
    const expenses = {};
    sales.forEach(sale => {
      const date = new Date(sale.date);
      const week = getWeekNumber(date);
      const year = date.getFullYear();
      const weekKey = `${year}-W${week}`;
      if (!expenses[weekKey]) {
        expenses[weekKey] = 0;
      }
      expenses[weekKey] += sale.total;
    });
    return expenses;
  };

  const getWeekNumber = (date) => {
    const startDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startDate.getDay() + 1) / 7);
  };

  const weeklyExpenses = calculateWeeklyExpenses();
  const weeks = Object.keys(weeklyExpenses);
  const totalExpensesData = weeks.map(week => weeklyExpenses[week]);

  const chartData = {
    pie: {
      labels: products.map(product => product.name),
      datasets: [
        {
          data: products.map(product => {
            const totalKgSold = sales.filter(sale => sale.date === selectedDate || isCurrentDay)
              .reduce((sum, sale) => sum + sale.items
                .filter(item => item._id === product._id)
                .reduce((itemSum, item) => {
                  const sizeInKg = parseFloat(item.size) / 1000; // Convert size to kg
                  return itemSum + (item.quantity * sizeInKg);
                }, 0), 0);
            return totalKgSold * 1000; // Convert to grams
          }),
          backgroundColor: chartColors.slice(0, products.length),
        },
      ],
    },
    bar: {
      labels: weeks,
      datasets: [
        {
          label: 'Weekly Expenses',
          data: totalExpensesData,
          backgroundColor: 'rgba(153,102,255,0.6)',
        },
      ],
    },
    heatmap: {
      labels: products.map(product => product.name),
      datasets: [
        {
          label: 'Trending Products',
          data: products.map(product => {
            const totalKgSold = sales.reduce((sum, sale) => sum + sale.items
              .filter(item => item._id === product._id)
              .reduce((itemSum, item) => {
                const sizeInKg = parseFloat(item.size) / 1000; // Convert size to kg
                return itemSum + (item.quantity * sizeInKg);
              }, 0), 0);
            return totalKgSold; // Return total kg sold
          }),
          backgroundColor: chartColors.slice(0, products.length),
        },
      ],
    },
  };

  return (
    <Container>
      <h1 className="my-4">Pi Foods POS</h1>
      <Tab.Container defaultActiveKey="products">
        <Nav variant="tabs">
          <Nav.Item>
            <Nav.Link eventKey="products">Counter</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="profit">Profits</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="addStock">Purchase</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="graphs">Analytics</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="addProduct">Add Product</Nav.Link>
          </Nav.Item>
        </Nav>
        <Tab.Content>
          <Tab.Pane eventKey="products">
            <h2>Products</h2>
            <Row>
              <Col md={8}>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Stock (kg)</th>
                      <th>Variants</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td style={{ color: product.stock === 0 ? 'red' : 'black' }}>
                          {product.stock.toFixed(1)}
                        </td>
                        <td>
                          <Form.Group>
                            <Form.Label>Select Quantity</Form.Label>
                            <Form.Control
                              as="select"
                              value={quantity[product._id] || ''}
                              onChange={(e) => handleQuantityChange(product._id, e.target.value)}
                            >
                              <option value="">Select size</option>
                              {product.variants.map((variant, index) => (
                                <option key={index} value={variant.size}>
                                  {variant.size} - ₹{variant.price}
                                </option>
                              ))}
                            </Form.Control>
                          </Form.Group>
                          {quantity[product._id] && (
                            <Form.Group>
                              <Form.Label>Discount (₹)</Form.Label>
                              <Form.Control
                                type="number"
                                value={discount[product._id]?.[quantity[product._id]] || 0}
                                onChange={(e) => handleDiscountChange(product._id, quantity[product._id], e.target.value)}
                              />
                            </Form.Group>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                          >
                            Add to Cart
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
              <Col md={4}>
                <h4>Cart</h4>
                {cart.length === 0 ? (
                  <p>Your cart is empty</p>
                ) : (
                  <Table bordered>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Size</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>{item.size}</td>
                          <td>₹{item.price}</td>
                          <td>{item.quantity}</td>
                          <td>
                            <Button variant="danger" onClick={() => handleRemoveFromCart(index)}>
                              X
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
                <h5>Total: ₹{calculateTotalWithDiscount()}</h5>
                <Form.Group>
                  <Form.Label>Sale Date</Form.Label>
                  <Form.Control type="date" value={saleDate} onChange={handleSaleDateChange} disabled={isCurrentDay} />
                </Form.Group>
                <Form.Group>
                  <Form.Check
                    type="radio"
                    label="Current Day"
                    value="current"
                    checked={isCurrentDay}
                    onChange={handleRadioChange}
                  />
                  <Form.Check
                    type="radio"
                    label="Pick Date"
                    value="any"
                    checked={!isCurrentDay}
                    onChange={handleRadioChange}
                  />
                </Form.Group>
                <Button
                  variant="success"
                  onClick={() => {
                    if (cart.length === 0) {
                      alert('Your cart is empty. Add items before completing the sale.');
                    } else {
                      recordSales();
                    }
                  }}
                >
                  Complete Sale
                </Button>
                <Button variant="danger" onClick={resetSales} style={{ marginLeft: '10px' }}>
                  Reset Sales
                </Button>
              </Col>
            </Row>
            <h3>Sales History</h3>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item Name</th>
                  <th>Quantity (g)</th>
                  <th>Quantity of Items</th>
                  <th>Discount (₹)</th>
                  <th>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => (
                  <tr key={index}>
                    <td>{sale.date}</td>
                    <td>
                      {sale.items.map(item => (
                        <div key={item._id}>{item.name} ({item.size}): {item.quantity}</div>
                      ))}
                    </td>
                    <td>
                      {sale.items.map(item => (
                        <div key={item._id}>{item.size}</div>
                      ))}
                    </td>
                    <td>
                      {sale.items.map(item => (
                        <div key={item._id}>{item.quantity}</div>
                      ))}
                    </td>
                    <td>
                      {sale.items.map(item => (
                        <div key={item._id}>₹{item.discount}</div>
                      ))}
                    </td>
                    <td>₹{sale.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="5"><strong>Grand Total</strong></td>
                  <td><strong>₹{calculateSalesTotal()}</strong></td>
                </tr>
              </tfoot>
            </Table>
            <Button variant="info" onClick={generateInvoice} style={{ marginTop: '10px' }}>
              Download Invoice
            </Button>
          </Tab.Pane>
          <Tab.Pane eventKey="profit">
            <h4>Profits</h4>
            {profits.length === 0 ? (
              <p>No profits to show yet.</p>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Profit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {profits.map((profit, index) => (
                    <tr key={index}>
                      <td>{profit.name}</td>
                      <td>₹{profit.profit}</td>
                    </tr>
                  ))}
                  <tr>
                    <td><strong>Total Gross Profit</strong></td>
                    <td><strong>₹{grandTotalProfit}</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Total Net Profit</strong></td>
                    <td><strong>₹{calculateTotalNetProfit()}</strong></td>
                  </tr>
                </tbody>
              </Table>
            )}
          </Tab.Pane>
          <Tab.Pane eventKey="addStock">
            <h4>Add Stock</h4>
            <Form>
              <Form.Group>
                <Form.Label>Item Name</Form.Label>
                <Form.Control
                  as="select"
                  name="itemName"
                  value={newStock.itemName}
                  onChange={(e) => {
                    handleNewStockChange(e);
                    handleItemChange(e);
                  }}
                >
                  <option value="">Select item</option>
                  {products.map((product) => (
                    <option key={product._id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                  <option value="Others">Others</option>
                </Form.Control>
              </Form.Group>
              {isOthersSelected ? (
                <>
                  <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      type="text"
                      name="description"
                      value={newStock.description}
                      onChange={handleNewStockChange}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Price</Form.Label>
                    <Form.Control
                      type="number"
                      name="price"
                      value={newStock.price}
                      onChange={handleNewStockChange}
                    />
                  </Form.Group>
                </>
              ) : (
                <Form.Group>
                  <Form.Label>Quantity (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    value={newStock.quantity}
                    onChange={handleNewStockChange}
                  />
                </Form.Group>
              )}
              <Form.Group>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={newStock.date}
                  onChange={handleNewStockChange}
                />
              </Form.Group>
              <Button variant="primary" onClick={handleAddStock}>
                Add to Stock
              </Button>
            </Form>
            <h5 className="mt-4">Purchase History</h5>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price per kg</th>
                  <th>Description</th>
                  <th>Total Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {purchaseHistory.map((purchase, index) => (
                  <tr key={index}>
                    <td>{purchase.date}</td>
                    <td>{purchase.itemName}</td>
                    <td>{purchase.quantity === null ? '' : `${purchase.quantity} kg`}</td>
                    <td>₹{purchase.price}</td>
                    <td>{purchase.description}</td>
                    <td>₹{(purchase.price * (purchase.quantity || 1)).toFixed(2)}</td>
                    <td>
                      <Button variant="danger" onClick={() => handleDeleteRecord(index)}>
                        X
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="5"><strong>Grand Total</strong></td>
                  <td><strong>₹{calculatePurchaseTotal()}</strong></td>
                </tr>
              </tfoot>
            </Table>
          </Tab.Pane>
          <Tab.Pane eventKey="graphs">
            <h4>Sales Overview</h4>
            <h5>Sales by Product (Pie Chart)</h5>
            <div className="pie-chart">
              <Pie data={chartData.pie} />
            </div>
            <h5>Weekly Expenses (Bar Chart)</h5>
            <div className="bar-chart">
              <Bar data={chartData.bar} />
            </div>
            <h5>Trending Products (Bar Chart)</h5>
            <div className="heatmap-chart">
              <Bar data={chartData.heatmap} />
            </div>
          </Tab.Pane>
          <Tab.Pane eventKey="addProduct">
            <h4>{editingProduct ? 'Edit Product' : 'Add New Product'}</h4>
            <Form>
              <Form.Group>
                <Form.Label>Product Name</Form.Label>
                <Form.Control
                  type="text"
                  value={editingProduct ? editingProduct.name : newProduct.name}
                  onChange={(e) => {
                    if (editingProduct) {
                      setEditingProduct({ ...editingProduct, name: e.target.value });
                    } else {
                      setNewProduct({ ...newProduct, name: e.target.value });
                    }
                  }}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Cost Price (CP) per kg</Form.Label>
                <Form.Control
                  type="number"
                  value={editingProduct ? editingProduct.cpPerKg : newProduct.cpPerKg}
                  onChange={(e) => {
                    if (editingProduct) {
                      setEditingProduct({ ...editingProduct, cpPerKg: e.target.value });
                    } else {
                      setNewProduct({ ...newProduct, cpPerKg: e.target.value });
                    }
                  }}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Selling Price (SP) per kg</Form.Label>
                <Form.Control
                  type="number"
                  value={editingProduct ? editingProduct.spPerKg : newProduct.spPerKg}
                  onChange={(e) => {
                    if (editingProduct) {
                      setEditingProduct({ ...editingProduct, spPerKg: e.target.value });
                    } else {
                      setNewProduct({ ...newProduct, spPerKg: e.target.value });
                    }
                  }}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Size Variants</Form.Label>
                {(editingProduct ? editingProduct.variants : newProduct.variants).map((variant, index) => (
                  <div key={index}>
                    <Form.Control
                      type="text"
                      placeholder="Size (e.g., 100g, 200g, 500g)"
                      value={variant.size}
                      onChange={(e) => {
                        const updatedVariants = editingProduct ? [...editingProduct.variants] : [...newProduct.variants];
                        updatedVariants[index].size = e.target.value;
                        if (editingProduct) {
                          setEditingProduct({ ...editingProduct, variants: updatedVariants });
                        } else {
                          setNewProduct({ ...newProduct, variants: updatedVariants });
                        }
                      }}
                    />
                    <Form.Control
                      type="number"
                      placeholder="Price"
                      value={variant.price}
                      onChange={(e) => {
                        const updatedVariants = editingProduct ? [...editingProduct.variants] : [...newProduct.variants];
                        updatedVariants[index].price = e.target.value;
                        if (editingProduct) {
                          setEditingProduct({ ...editingProduct, variants: updatedVariants });
                        } else {
                          setNewProduct({ ...newProduct, variants: updatedVariants });
                        }
                      }}
                    />
                    <Button
                      variant="danger"
                      onClick={() => {
                        const updatedVariants = (editingProduct ? editingProduct.variants : newProduct.variants).filter((_, i) => i !== index);
                        if (editingProduct) {
                          setEditingProduct({ ...editingProduct, variants: updatedVariants });
                        } else {
                          setNewProduct({ ...newProduct, variants: updatedVariants });
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="primary"
                  onClick={() => {
                    const updatedVariants = editingProduct ? [...editingProduct.variants, { size: '', price: '' }] : [...newProduct.variants, { size: '', price: '' }];
                    if (editingProduct) {
                      setEditingProduct({ ...editingProduct, variants: updatedVariants });
                    } else {
                      setNewProduct({ ...newProduct, variants: updatedVariants });
                    }
                  }}
                >
                  Add Variant
                </Button>
              </Form.Group>
              <Button
                variant="success"
                onClick={() => {
                  if (editingProduct) {
                    fetch(`http://localhost:5000/products/${editingProduct._id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(editingProduct)
                    })
                    .then(response => response.json())
                    .then(updatedProduct => {
                      const updatedProducts = products.map(product => product._id === updatedProduct._id ? updatedProduct : product);
                      setProducts(updatedProducts);
                      setEditingProduct(null);
                    });
                  } else {
                    handleAddProduct();
                  }
                }}
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
              {editingProduct && (
                <Button
                  variant="secondary"
                  onClick={() => setEditingProduct(null)}
                  style={{ marginLeft: '10px' }}
                >
                  Cancel
                </Button>
              )}
            </Form>
            <h4 className="mt-4">Existing Products</h4>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>CP per kg</th>
                  <th>SP per kg</th>
                  <th>Variants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td>{product.name}</td>
                    <td>₹{product.cpPerKg}</td>
                    <td>₹{product.spPerKg}</td>
                    <td>
                      {product.variants.map((variant, index) => (
                        <div key={index}>{variant.size} - ₹{variant.price}</div>
                      ))}
                    </td>
                    <td>
                      <Button variant="warning" onClick={() => setEditingProduct(product)}>Edit</Button>
                      <Button variant="danger" onClick={() => deleteProduct(product._id)} style={{ marginLeft: '10px' }}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default App;

