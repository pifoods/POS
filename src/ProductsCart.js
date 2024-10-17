import React, { useState } from 'react';
import { Row, Col, Card, Button, Table, Form } from 'react-bootstrap';

const ProductsCart = ({ products, cart, quantity, handleQuantityChange, addToCart, removeFromCart, calculateTotal, saleDate, handleSaleDateChange, isCurrentDay, handleRadioChange, recordSales, resetSales, SalesChart }) => {
  return (
    <>
      <h2>Products</h2>
      <Row>
        <Col md={8}>
          <Row>
            {products.map((product) => (
              <Col key={product.id} md={4}>
                <Card className="mb-4">
                  <Card.Img variant="top" src={product.image} />
                  <Card.Body>
                    <Card.Title>{product.name}</Card.Title>
                    <Card.Text>Stock: {product.stock.toFixed(1)} kg</Card.Text>
                    <Form.Group>
                      <Form.Label>Select Quantity</Form.Label>
                      <Form.Control
                        as="select"
                        value={quantity[product.id] || ''}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      >
                        <option value="">Select size</option>
                        {product.variants.map((variant, index) => (
                          <option key={index} value={variant.size}>
                            {variant.size} - ₹{variant.price}
                          </option>
                        ))}
                      </Form.Control>
                    </Form.Group>
                    <Button variant="primary" onClick={() => addToCart(product)}>
                      Add to Cart
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
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
                      <Button variant="danger" onClick={() => removeFromCart(item.id, item.size)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <h5>Total: ₹{calculateTotal()}</h5>
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
          <Button variant="success" onClick={recordSales}>
            Complete Sale
          </Button>
          <Button variant="danger" onClick={resetSales} style={{ marginLeft: '10px' }}>
            Reset Sales
          </Button>
          <h2>Sales Line Chart</h2>
          <SalesChart />
        </Col>
      </Row>

      <h3>Sales History</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Date</th>
            <th>Items Sold</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((sale, index) => (
            <tr key={index}>
              <td>{sale.date}</td>
              <td>
                {sale.items.map(item => (
                  <div key={item.id}>{item.name} ({item.size}): {item.quantity}</div>
                ))}
              </td>
              <td>{sale.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default ProductsCart;
