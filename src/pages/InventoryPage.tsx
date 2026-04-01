import React from 'react';
import Inventory from '../components/Inventory';
import './PageChrome.css';

const InventoryPage: React.FC = () => {
  return (
    <div className="page-with-chrome">
      <Inventory />
    </div>
  );
};

export default InventoryPage;
