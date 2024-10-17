import React from 'react';
import { Form, Button, Table } from 'react-bootstrap';

const AddStock = ({ products, newStock, handleNewStockChange, handleAddStock, purchaseHistory, deletePurchaseRecord }) => {
  return (
    <div>
      <h4>Add Stock</h4>
      <Form>
        <Form.Group>
          <Form.Label>Item Name</Form.Label>
          <Form.Control
            as="select"
            name="itemName"
            value={newStock.itemName}
            onChange={handleNewStockChange}
          >
            <option value="">Select item</option>
            {products.map((product) => (
              <option key={product.id} value={product.name}>
                {product.name}
              </option>
            ))}
            <option value="Others">Others</option>
          </Form.Control>
        </Form.Group>
        {newStock.itemName === 'Others' && (
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
        )}
        <Form.Group>
          <Form.Label>Quantity (kg)</Form.Label>
          <Form.Control
            type="number"
            name="quantity"
            value={newStock.quantity}
            onChange={handleNewStockChange}
          />
        </Form.Group>
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
      <Table bordered>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Quantity (kg)</th>
            <th>Date</th>
            <th>Description</th>
            <th>Price</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {purchaseHistory.map((purchase, index) => (
            <tr key={index}>
              <td>{purchase.itemName}</td>
              <td>{purchase.quantity}</td>
              <td>{purchase.date}</td>
              <td>{purchase.description || '-'}</td>
              <td>{purchase.price || '-'}</td>
              <td>
                <Button variant="danger" size="sm" onClick={() => deletePurchaseRecord(index)}>
                  X
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AddStock;
