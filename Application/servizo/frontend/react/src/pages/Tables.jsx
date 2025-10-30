
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/Tables.css';
import AddItemModal from '../components/AddItemModal'; 


const Tables = () => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [unpaidOrders, setUnpaidOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [newOrderTables, setNewOrderTables] = useState(new Set());
    const [cashRequests, setCashRequests] = useState(new Set());
    const previousTablesRef = useRef(null);

    const { user, ready } = useAuth();
    const navigate = useNavigate();
    const allowedRoles = ['waiter', 'manager', 'admin'];

    const CASH_REQUEST_KEY = 'cash_payment_requests';

    useEffect(() => {
        const updateCashRequests = () => {
            try {
                const requests = JSON.parse(localStorage.getItem(CASH_REQUEST_KEY) || '{}');
                const tableNumbers = Object.keys(requests).map(Number);
                setCashRequests(new Set(tableNumbers));
            } catch (e) {
                console.error("Failed to parse cash payment requests from localStorage", e);
            }
        };

        updateCashRequests(); 

        const handleStorageChange = (event) => {
            if (event.key === CASH_REQUEST_KEY) {
                updateCashRequests();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);


    useEffect(() => {
        if (ready && (!user || !allowedRoles.includes(user.role))) {
            navigate('/');
        }
    }, [user, ready, navigate]);

    const fetchTables = useCallback(async () => {
        try {
            const response = await api.get('/api/tables/');
            const tablesData = response.data.detail;
            const sortedTables = tablesData.sort((a, b) => a.table_number - b.table_number);
            
            if (previousTablesRef.current) {
                const prevTablesMap = new Map(previousTablesRef.current.map(t => [t.id, t]));
                const tablesWithNewOrders = new Set();
                sortedTables.forEach(table => {
                    const prevTable = prevTablesMap.get(table.id);
                    if (prevTable && parseFloat(table.amount_due) > parseFloat(prevTable.amount_due)) {
                        tablesWithNewOrders.add(table.id);
                    }
                });

                if (tablesWithNewOrders.size > 0) {
                    setNewOrderTables(prev => {
                        const next = new Set(prev);
                        tablesWithNewOrders.forEach(id => next.add(id));
                        return next;
                    });
                }
            }
            previousTablesRef.current = sortedTables;

            setTables(sortedTables);
            return sortedTables; // Return the fetched tables
        } catch (err) {
            setError('Error fetching tables.');
            console.error(err);
            return null; // Return null on error
        } finally {
            setLoading(false);
        }
    }, [setTables, setNewOrderTables, setError, setLoading]);

    const fetchUnpaidOrders = async (tableNumber) => {
        if (!tableNumber) return;
        setOrdersLoading(true);
        try {
            const response = await api.get(`/api/orders/unpaid/${tableNumber}/`);
            setUnpaidOrders(response.data.orders || []);
        } catch (err) {
            console.error(`Error fetching orders for table ${tableNumber}:`, err);
            setUnpaidOrders([]);
        }
    
    finally {
            setOrdersLoading(false);
        }
    };

    useEffect(() => {
        if (ready && user && allowedRoles.includes(user.role)) {
            fetchTables();
            const interval = setInterval(fetchTables, 5000);
            return () => clearInterval(interval);
        }
    }, [ready, user, fetchTables]);

    useEffect(() => {
        if (selectedTable) {
            fetchUnpaidOrders(selectedTable.table_number);
        } else {
            setUnpaidOrders([]);
        }
    }, [selectedTable]);

    const handleTableSelect = (table) => {
        setNewOrderTables(prev => {
            if (prev.has(table.id)) {
                const next = new Set(prev);
                next.delete(table.id);
                return next;
            }
            return prev;
        });

        if (cashRequests.has(table.table_number)) {
            try {
                const existingRequests = JSON.parse(localStorage.getItem(CASH_REQUEST_KEY) || '{}');
                delete existingRequests[table.table_number];
                localStorage.setItem(CASH_REQUEST_KEY, JSON.stringify(existingRequests));
                setCashRequests(prev => {
                    const next = new Set(prev);
                    next.delete(table.table_number);
                    return next;
                });
            } catch (e) {
                console.error("Failed to update cash payment requests in localStorage", e);
            }
        }

        setSelectedTable(table);
    };

    const handlePayOrderWithCash = async (orderId) => {
        try {
            await api.post(`/api/orders/pay/${orderId}/`);
            setUnpaidOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
            const newTables = await fetchTables();
            if (newTables && selectedTable) {
                const updatedSelectedTable = newTables.find(t => t.id === selectedTable.id);
                if (updatedSelectedTable) {
                    setSelectedTable(updatedSelectedTable);
                }
            }
        } catch (err) {
            setError('Error processing payment.');
            console.error(err);
        }
    };

    const handlePayTableWithCash = async () => {
        if (!selectedTable) return;
        try {
            await api.post('/api/orders/pay-table/', { table_num: selectedTable.table_number });
            setUnpaidOrders([]);
            const newTables = await fetchTables();
            if (newTables && selectedTable) {
                const updatedSelectedTable = newTables.find(t => t.id === selectedTable.id);
                if (updatedSelectedTable) {
                    setSelectedTable(updatedSelectedTable);
                }
            }
        } catch (err) {
            setError('Error paying for the entire table.');
            console.error(err);
        }
    };

    const handleOrderCreated = async () => {
        await fetchUnpaidOrders(selectedTable.table_number);
        const newTables = await fetchTables();
        if (newTables && selectedTable) {
            const updatedSelectedTable = newTables.find(t => t.id === selectedTable.id);
            if (updatedSelectedTable) {
                setSelectedTable(updatedSelectedTable);
            }
        }
    };

    if (!ready || loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!user || !allowedRoles.includes(user.role)) return <p>Access denied.</p>;

    return (
        <div className="tables-page-container">
            <div className="tables-grid-container">
                {tables.map(table => {
                    const isBusy = parseFloat(table.amount_due) > 0;
                    const isSelected = selectedTable && selectedTable.id === table.id;
                    const hasNewOrder = newOrderTables.has(table.id);
                    const hasCashRequest = cashRequests.has(table.table_number);
                    return (
                        <div
                            key={table.id}
                            className={`table-circle ${isBusy ? 'busy' : 'free'} ${isSelected ? 'selected' : ''} ${hasNewOrder ? 'new-order-pulse' : ''} ${hasCashRequest ? 'payment-requested-pulse' : ''}`}
                            onClick={() => handleTableSelect(table)}
                        >
                            {hasNewOrder && <div className="notification-badge">1</div>}
                            {table.table_number}
                        </div>
                    );
                })}
            </div>

            <div className="selected-table-view">
                {selectedTable ? (
                    <>
                        <h2>
                            Table {selectedTable.table_number}
                            <button className="add-item-btn" onClick={() => setIsModalOpen(true)}>Add Item</button>
                        </h2>
                        {ordersLoading ? (
                            <div className="no-unpaid-orders"><p>Loading orders...</p></div>
                        ) : unpaidOrders.length > 0 ? (
                            <>
                                {unpaidOrders.map(order => {
                                    const orderTotal = order.items.reduce((total, item) => total + (item.quantity * parseFloat(item.price)), 0);

                                    return (
                                        <div key={order.id} className="order-card">
                                            <div className="order-card-header">
                                                <h4>Order</h4>
                                                <span className="order-card-total">{orderTotal.toFixed(2)} €</span>
                                            </div>
                                            <ul className="orders-list">
                                                {order.items.map(item => (
                                                    <li key={item.id} className="order-item">
                                                        <div className="order-item-details">
                                                            <span className="order-item-quantity">{item.quantity}x</span>
                                                            <span className="order-item-name">{item.name}</span>
                                                        </div>
                                                        <span className="order-item-price">
                                                            {(item.quantity * parseFloat(item.price)).toFixed(2)} €
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <button
                                                className="pay-cash-btn"
                                                onClick={() => handlePayOrderWithCash(order.id)}
                                            >
                                                Paid in cash
                                            </button>
                                        </div>
                                    );
                                })}
                                
                                {unpaidOrders.length > 1 && (
                                    <div className="pay-all-container">
                                        <div className="total-amount-due">
                                            Total due: {parseFloat(selectedTable.amount_due).toFixed(2)} €
                                        </div>
                                        <button className="pay-all-btn" onClick={handlePayTableWithCash}>
                                            Pay for whole table
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="no-unpaid-orders"><p>No unpaid orders for this table.</p></div>
                        )}
                    </>
                ) : (
                    <div className="no-table-selected"><p>Select a table to see details.</p></div>
                )}
            </div>

            {isModalOpen && selectedTable && (
                <AddItemModal 
                    tableNumber={selectedTable.table_number}
                    onClose={() => setIsModalOpen(false)}
                    onOrderCreated={handleOrderCreated}
                />
            )}
        </div>
    );
};

export default Tables;