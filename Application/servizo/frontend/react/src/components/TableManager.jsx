import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import '../styles/TableManager.css';

const TableManager = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [addInput, setAddInput] = useState('');
    const [deleteInput, setDeleteInput] = useState('');

    const fetchTables = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/tables/');
            setTables(response.data.detail || []);
        } catch (err) {
            setError('Error fetching tables.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    const handleAddNextTable = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.post('/api/tables/add_next_table/');
            setSuccess('New table added successfully.');
            fetchTables();
        } catch (err) {
            const message = err.response?.data?.detail || (typeof err.response?.data === 'string' ? err.response.data : 'Error adding table.');
            setError(message);
        }
    };

    const handleAddSpecificTable = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!addInput) {
            setError('Please enter a table number.');
            return;
        }
        if (parseInt(addInput, 10) < 1) {
            setError('Table number must be positive.');
            return;
        }
        try {
            await api.post(`/api/tables/add/${addInput}/`);
            setSuccess(`Table ${addInput} added successfully.`);
            setAddInput('');
            fetchTables();
        } catch (err) {
            const message = err.response?.data?.detail || (typeof err.response?.data === 'string' ? err.response.data : 'Error adding table.');
            setError(message);
        }
    };

    const handleDeleteTable = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!deleteInput) {
            setError('Please enter a table number.');
            return;
        }
        if (parseInt(deleteInput, 10) < 1) {
            setError('Table number must be positive.');
            return;
        }
        if (window.confirm(`Are you sure you want to delete table ${deleteInput}?`)) {
            try {
                await api.delete(`/api/tables/delete/${deleteInput}/`);
                setSuccess(`Table ${deleteInput} deleted successfully.`);
                setDeleteInput('');
                fetchTables();
            } catch (err) {
                const message = err.response?.data?.detail || (typeof err.response?.data === 'string' ? err.response.data : 'Error deleting table.');
                setError(message);
            }
        }
    };

    if (loading) return <p>Loading tables...</p>;

    return (
        <div className="table-manager-minimal-container">
            <h2>Table Management</h2>
            <p className="table-count">Total Tables: {tables.length}</p>
            
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <div className="manager-actions">
                <form onSubmit={handleAddNextTable} className="action-form">
                    <button type="submit" className="btn-manager">Add Next Table</button>
                </form>
                <form onSubmit={handleAddSpecificTable} className="action-form">
                    <input
                        type="number"
                        min="1"
                        value={addInput}
                        onChange={(e) => setAddInput(e.target.value)}
                        placeholder="Table Number"
                        className="manager-input"
                    />
                    <button type="submit" className="btn-manager">Add Table</button>
                </form>
                <form onSubmit={handleDeleteTable} className="action-form">
                    <input
                        type="number"
                        min="1"
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        placeholder="Table Number"
                        className="manager-input"
                    />
                    <button type="submit" className="btn-manager btn-delete">Delete Table</button>
                </form>
            </div>
        </div>
    );
};

export default TableManager;
