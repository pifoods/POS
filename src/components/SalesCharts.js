import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { Bar, Line, Pie } from 'react-chartjs-2';

const SalesCharts = ({ getDailySalesData, getWeeklySalesData, getMonthlySalesData }) => {
  return (
    <Row>
      <Col md={6}>
        <h2>Daily Sales</h2>
        <Bar data={getDailySalesData()} />
      </Col>
      <Col md={6}>
        <h2>Weekly Sales</h2>
        <Bar data={getWeeklySalesData()} />
      </Col>
      <Col md={6}>
        <h2>Monthly Sales</h2>
        <Line data={getMonthlySalesData()} />
      </Col>
      <Col md={6}>
        <h2>Sales Distribution</h2>
        <Pie data={getDailySalesData()} />
      </Col>
    </Row>
  );
};

export default SalesCharts;
