import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api';

const MenuContext = createContext(null);

export const MenuProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        api.get('/api/menu/items/'),
        api.get('/api/menu/categories/')
      ]);

      if (Array.isArray(itemsResponse.data)) {
        setMenuItems(itemsResponse.data);
      } else {
        console.warn("Received non-array data for menu items:", itemsResponse.data);
        setMenuItems([]);
      }

      if (Array.isArray(categoriesResponse.data)) {
        setCategories(categoriesResponse.data);
      } else {
        console.warn("Received non-array data for categories:", categoriesResponse.data);
        setCategories([]);
      }
    } catch (err) {
      setError('Failed to fetch menu data.');
      console.error(err);
      setMenuItems([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const contextData = {
    menuItems,
    categories,
    isLoading,
    error,
    refetchData: fetchData,
  };

  return (
    <MenuContext.Provider value={contextData}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  return useContext(MenuContext);
};