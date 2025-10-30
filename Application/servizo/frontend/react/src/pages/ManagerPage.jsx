import React from 'react';
import MenuManager from '../components/MenuManager';
import CategoryManager from '../components/CategoryManager';
import TableManager from '../components/TableManager';
import { MenuProvider } from '../context/MenuContext';
import '../styles/ManagerPage.css';
import '../styles/TableManager.css';

const ManagerPage = () => {
  return (
    <MenuProvider>
      <div className="manager-dashboard">
        <h1 className="mb-4">Manager Dashboard</h1>
        <TableManager />
        <div className="manager-container">
          <div className="manager-column">
            <CategoryManager />
          </div>
          <div className="manager-column">
            <MenuManager />
          </div>
        </div>
      </div>
    </MenuProvider>
  );
};

export default ManagerPage;
