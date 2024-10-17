import React from 'react';
import { Row, Col, Card, Button, Table, Form } from 'react-bootstrap';

const ProductsCart = ({ products, cart, quantity, setQuantity, addToCart, removeFromCart, calculateTotal, recordSales, resetSales, isCurrentDay, saleDate, handleSaleDateChange, handleRadioChange }) => {
  return (
    <Row>
      <Col md={8}>
        <h2>Products</h2>
        <Row>
          {products.map((product) => (
            <Col md={4} key={product.id}>
              <Card>
                <Card.Img variant="top" src={product.image} />
                <Card.Body>
                  <Card.Title>{product.name}</Card.Title>
                  <Form.Group controlId="size">
                    <Form.Label>Select Size</Form.Label>
                    <Form.Control
                      as="select"
                      value={quantity[product.id] || ''}
                      onChange={(e) => setQuantity({ ...quantity, [product.id]: e.target.value })}
                    >
                      <option value="">Select size</option>
                      {product.variants.map((variant) => (
                        <option key={variant.size} value={variant.size}>
                          {variant.size} - ₹{variant.price}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                  <Button onClick={() => addToCart(product)} disabled={!quantity[product.id]}>
                    Add to Cart
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Col>

      <Col md={4}>
        <h2>Cart</h2>
        <Table striped bordered hover>
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
            {cart.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.size}</td>
                <td>{item.price}</td>
                <td>{item.quantity}</td>
                <td>
                  <Button onClick={() => removeFromCart(item.id, item.size)}>Remove</Button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan="3">Total</td>
              <td colSpan="2">₹{calculateTotal()}</td>
            </tr>
          </tbody>
        </Table>
        <Form.Group>
          <Form.Label>Select Sale Date</Form.Label>
          <Form.Control
            type="date"
            value={isCurrentDay ? undefined : saleDate}
            disabled={isCurrentDay}
            onChange={handleSaleDateChange}
          />
          <Form.Check
            type="radio"
            label="Current Day"
            name="dateSelection"
            value="current"
            checked={isCurrentDay}
            onChange={handleRadioChange}
          />
          <Form.Check
            type="radio"
            label="Specific Date"
            name="dateSelection"
            value="specific"
            checked={!isCurrentDay}
            onChange={handleRadioChange}
          />
        </Form.Group>
        <Button onClick={recordSales} disabled={cart.length === 0}>Checkout</Button>
        <Button onClick={resetSales} variant="secondary" style={{ marginLeft: '10px' }}>Reset Sales</Button>
      </Col>
    </Row>
  );
};

export default ProductsCart;
