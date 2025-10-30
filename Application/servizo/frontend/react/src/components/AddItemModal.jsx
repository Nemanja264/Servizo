

import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/AddItemModal.css';

const AddItemModal = ({ tableNumber, onClose, onOrderCreated }) => {
    const [menu, setMenu] = useState({});
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const response = await api.get('/api/menu/items/');
            
                const groupedMenu = response.data.reduce((acc, item) => {
                    const category = item.category || 'Other';
                    if (!acc[category]) {
                        acc[category] = [];
                    }
                    acc[category].push(item);
                    return acc;
                }, {});
                setMenu(groupedMenu);
            } catch (err) {
                setError('Error loading menu.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, []);

    const addToCart = (item) => {
        setCart(prevCart => ({
            ...prevCart,
            [item.id]: (prevCart[item.id] || 0) + 1
        }));
    };

    const removeFromCart = (item) => {
        setCart(prevCart => {
            const newCart = { ...prevCart };
            if (newCart[item.id] > 1) {
                newCart[item.id] -= 1;
            } else {
                delete newCart[item.id];
            }
            return newCart;
        });
    };

    const getCartItems = () => {
        const allItems = Object.values(menu).flat();
        return Object.entries(cart).map(([itemId, quantity]) => {
            const item = allItems.find(i => i.id === itemId);
            return { ...item, quantity };
        });
    };

    const cartItems = getCartItems();
    const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    const filteredMenu = React.useMemo(() => {
        let menuItems = Object.entries(menu);

        if (selectedCategory !== 'All') {
            menuItems = menuItems.filter(([category]) => category === selectedCategory);
        }

        if (searchQuery) {
            menuItems = menuItems.map(([category, items]) => {
                const filteredItems = items.filter(item =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                return [category, filteredItems];
            }).filter(([, items]) => items.length > 0);
        }

        return menuItems;
    }, [menu, selectedCategory, searchQuery]);

    const handleConfirmOrder = async () => {
        if (cartItems.length === 0) return;

        const orderData = {
            items: cartItems.map(item => ({ id: item.id, quantity: item.quantity }))
        };

        try {
            await api.post(`/api/orders/create/${tableNumber}/`, orderData);
            onOrderCreated(); 
            onClose(); 
        } catch (err) {
            setError('Error creating order.');
            console.error(err);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Add to order for Table {tableNumber}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="menu-container">
                        <div className="menu-filters">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="search-bar"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <div className="category-buttons">
                                <button onClick={() => setSelectedCategory('All')} className={selectedCategory === 'All' ? 'active' : ''}>All</button>
                                {Object.keys(menu).map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={selectedCategory === category ? 'active' : ''}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {loading && <p>Loading menu...</p>}
                        {error && <p>{error}</p>}
                        {filteredMenu.map(([category, items]) => (
                            <div key={category}>
                                <h4 className="category-title">{category}</h4>
                                {items.map(item => (
                                    <div key={item.id} className="menu-item">
                                        <div>
                                            <span className="menu-item-name">{item.name}</span>
                                            <br />
                                            <span className="menu-item-price">{parseFloat(item.price).toFixed(2)} €</span>
                                        </div>
                                        <button className="add-to-cart-btn" onClick={() => addToCart(item)}>Add</button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="cart-container">
                        <h4>Cart</h4>
                        {cartItems.length > 0 ? (
                            <ul className="cart-items">
                                {cartItems.map(item => (
                                    <li key={item.id} className="cart-item">
                                        <span>{item.name}</span>
                                        <div className="cart-item-controls">
                                            <button className="quantity-btn" onClick={() => removeFromCart(item)}>-</button>
                                            <span>{item.quantity}</span>
                                            <button className="quantity-btn" onClick={() => addToCart(item)}>+</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Cart is empty.</p>
                        )}
                        <div className="cart-total">
                            Total: {cartTotal.toFixed(2)} €
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button 
                        className="confirm-order-btn"
                        onClick={handleConfirmOrder}
                        disabled={cartItems.length === 0}
                    >
                        Confirm Order
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddItemModal;
