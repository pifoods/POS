import React from 'react';
import { Table, Form } from 'react-bootstrap';

const AvailableStock = ({ products, editStock }) => {
  return (
    <div>
      <h2>Available Stock</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Product</th>
            <th>Stock</th>
            <th>Edit Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.stock}</td>
              <td>
                <Form.Control
                  type="number"
                  value={product.stock}
                  onChange={(e) => editStock(product.id, e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AvailableStock;
