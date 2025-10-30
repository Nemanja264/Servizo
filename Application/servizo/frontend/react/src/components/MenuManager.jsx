import React, { useState } from 'react';
import api from '../api';
import { useMenu } from '../context/MenuContext';

const MenuManager = () => {
  const { menuItems, categories, isLoading, error, refetchData } = useMenu();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    name: '', price: '', description: '', category_id: '', available: true,
  });

  const [catOpen, setCatOpen] = useState(false);
  const [catErr, setCatErr] = useState(null);
  const [catName, setCatName] = useState('');
  const [catParentId, setCatParentId] = useState('');

  const handleOpenModal = (item = null) => {
    setFormError(null);
    setCurrentItem(item);
    if (item) {
      setFormData({
        name: item.name,
        price: item.price,
        description: item.description || '',
        category_id: item.category_id,
        available: item.available,
      });
    } else {
      setFormData({
        name: '', price: '', description: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        available: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (currentItem) {
        await api.post(`/api/menu/items/${currentItem.id}/update/`, {
          item_id: currentItem.id,
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id,
          available: formData.available,
        });
        await api.post(`/api/menu/items/${currentItem.id}/price/`, {
          item_id: currentItem.id,
          price: formData.price,
        });
      } else {
        await api.post('/api/menu/items/add/', {
          name: formData.name,
          price: formData.price,
          description: formData.description,
          category_id: formData.category_id,
        });
      }
      await refetchData();
      handleCloseModal();
    } catch (err) {
      setFormError(currentItem ? 'Failed to update item.' : 'Failed to add item.');
      console.error('API Error:', err.response?.data || err.message);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/api/menu/items/${itemId}/delete/`);
      await refetchData();
    } catch {
      alert('Failed to delete item.');
    }
  };

  const handleToggleAvailable = async (item) => {
    try {
      await api.post(`/api/menu/items/${item.id}/update/`, { available: !item.available });
      await refetchData();
    } catch {
      alert('Failed to update availability.');
    }
  };

  const openCat = () => { setCatErr(null); setCatName(''); setCatParentId(''); setCatOpen(true); };
  const closeCat = () => setCatOpen(false);
  const saveCat = async (e) => {
    e.preventDefault();
    setCatErr(null);
    try {
      await api.post('/api/menu/categories/add/', {
        name: catName,
        parent_id: catParentId || null,
      });
      await refetchData();
      closeCat();
    } catch (err) {
      setCatErr('Failed to add category.');
      console.error('API Error:', err.response?.data || err.message);
    }
  };

  if (isLoading) return <p>Loading menu...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="manager-card">
      <div className="manager-card-header">
        <h3>Manage Menu Items</h3>
        <div className="header-actions">
          
          <button className="btn btn-light btn-sm" onClick={() => handleOpenModal()}>Add New</button>
        </div>
      </div>

      <div className="manager-card-body">
        <ul className="manager-list">
          {menuItems.map(item => (
            <li key={item.id} className="manager-list-item">
              <div className="item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-details">{item.category} | {item.price} EUR</span>
              </div>
              <div className="item-actions d-flex align-items-center">
                <span
                  className={`badge me-2 ${item.available ? 'badge-available' : 'badge-unavailable'}`}
                  onClick={() => handleToggleAvailable(item)}
                >
                  {item.available ? 'Available' : 'Unavailable'}
                </span>
                <button className="btn btn-sm btn-outline-primary" onClick={() => handleOpenModal(item)}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isModalOpen && (
        <div className="manager-modal">
          <div className="manager-modal-content">
            <form onSubmit={handleSubmit}>
              <div className="manager-modal-header">
                <h5>{currentItem ? 'Edit Menu Item' : 'Add Menu Item'}</h5>
                <button type="button" className="modal-close" onClick={handleCloseModal} aria-label="Close">×</button>
              </div>

              <div className="modal-body">
                {formError && <p className="text-danger m-0">{formError}</p>}
                <div className="modal-grid">
                  <div className="full">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input type="text" className="form-control" id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div>
                    <label htmlFor="price" className="form-label">Price</label>
                    <input type="number" step="0.01" className="form-control" id="price" name="price" value={formData.price} onChange={handleChange} required />
                  </div>
                  <div>
                    <label htmlFor="category_id" className="form-label">Category</label>
                    <select className="form-select" id="category_id" name="category_id" value={formData.category_id} onChange={handleChange} required>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="full">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea className="form-control" id="description" name="description" rows="3" value={formData.description} onChange={handleChange} />
                  </div>
                  <div className="full form-check">
                    <input className="form-check-input" type="checkbox" id="available" name="available" checked={formData.available} onChange={handleChange} />
                    <label className="form-check-label" htmlFor="available">Available</label>
                  </div>
                </div>
              </div>

              <div className="manager-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Close</button>
                <button type="submit" className="btn btn-primary">Save changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {catOpen && (
        <div className="manager-modal">
          <div className="manager-modal-content">
            <form onSubmit={saveCat}>
              <div className="manager-modal-header">
                <h5>Add Category</h5>
                <button type="button" className="modal-close" onClick={closeCat} aria-label="Close">×</button>
              </div>

              <div className="modal-body">
                {catErr && <p className="text-danger m-0">{catErr}</p>}
                <div className="modal-grid">
                  <div className="full">
                    <label className="form-label" htmlFor="catName">Category Name</label>
                    <input id="catName" className="form-control" value={catName} onChange={(e)=>setCatName(e.target.value)} required />
                  </div>
                  <div className="full">
                    <label className="form-label" htmlFor="parentCat">Parent Category</label>
                    <select id="parentCat" className="form-select" value={catParentId} onChange={(e)=>setCatParentId(e.target.value)}>
                      <option value="">None (Top Level)</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="manager-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeCat}>Close</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
