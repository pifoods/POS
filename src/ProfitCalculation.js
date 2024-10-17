import React from 'react';
import { Table } from 'react-bootstrap';

const ProfitCalculation = ({ profits }) => {
  return (
    <div>
      <h4>Profit Calculation</h4>
      <Table bordered>
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
        </tbody>
      </Table>
    </div>
  );
};

export default ProfitCalculation;
