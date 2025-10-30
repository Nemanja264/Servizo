import React, { useState, useMemo } from 'react';
import api from '../api';
import { useMenu } from '../context/MenuContext';

const buildTree = (categories) => {
  if (!Array.isArray(categories)) {
    console.error("buildTree received non-array data:", categories);
    return [];
  }

  console.log("Raw categories for tree building:", JSON.stringify(categories, null, 2));

  const map = categories.reduce((acc, cat) => {
    acc[cat.id] = { ...cat, children: [] };
    return acc;
  }, {});

  const tree = [];
  Object.values(map).forEach(catNode => {
    if (catNode.parent) {
      const parentNode = map[catNode.parent];
      if (parentNode) {
        parentNode.children.push(catNode);
      } else {
        console.warn(`Orphaned category found: id=${catNode.id}, parent=${catNode.parent} not found.`);
        tree.push(catNode);
      }
    } else {
      tree.push(catNode);
    }
  });

  return tree;
};

const CategoryManager = () => {
  const { categories, refetchData } = useMenu();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', parent: '' });
  const [formError, setFormError] = useState(null);

  const categoryTree = useMemo(() => buildTree(categories), [categories]);

  const handleOpenModal = (category = null) => {
    setFormError(null);
    setCurrentCategory(category);
    setFormData({
      name: category ? category.name : '',
      parent: category ? category.parent || '' : ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCategory(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name.trim()) {
      setFormError('Category name cannot be empty.');
      return;
    }

    const endpoint = currentCategory
      ? `/api/menu/categories/${currentCategory.id}/update/`
      : '/api/menu/categories/add/';

    const payload = {
      name: formData.name,
      parent_id: formData.parent || null,
    };
    
    if (currentCategory) {
        payload.category_id = currentCategory.id;
        payload.new_name = formData.name;
        delete payload.name;
    }


    try {
      await api.post(endpoint, payload);
      await refetchData();
      handleCloseModal();
    } catch (err) {
      setFormError(currentCategory ? 'Failed to update category.' : 'Failed to add category.');
      console.error(err);
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This may affect existing menu items.')) {
      try {
        await api.delete(`/api/menu/categories/${categoryId}/delete/`);
        await refetchData();
      } catch (err) {
        alert('Failed to delete category.');
        console.error(err);
      }
    }
  };

  const RenderCategories = ({ categories, level = 0 }) => (
    <>
      {categories.map(cat => (
        <React.Fragment key={cat.id}>
          <li className="manager-list-item">
            <span className="item-name" style={{ paddingLeft: `${level * 28}px` }}>
              {cat.name}
            </span>
            <div className="item-actions">
              <button className="btn btn-sm btn-outline-primary" onClick={() => handleOpenModal(cat)}>Edit</button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(cat.id)}>Delete</button>
            </div>
          </li>
          {cat.children.length > 0 && (
            <RenderCategories categories={cat.children} level={level + 1} />
          )}
        </React.Fragment>
      ))}
    </>
  );

  return (
    <div className="manager-card">
      <div className="manager-card-header">
        <h3>Manage Categories</h3>
        <button className="btn btn-light btn-sm" onClick={() => handleOpenModal()}>Add New</button>
      </div>
      <div className="manager-card-body">
        <ul className="manager-list">
          <RenderCategories categories={categoryTree} />
        </ul>
      </div>

      {isModalOpen && (
        <div className="manager-modal">
          <div className="manager-modal-content">
            <form onSubmit={handleSubmit}>
              <div className="manager-modal-header">
                <h5>{currentCategory ? 'Edit Category' : 'Add Category'}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                {formError && <p className="text-danger">{formError}</p>}
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Category Name</label>
                  <input type="text" className="form-control" id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="parent" className="form-label">Parent Category</label>
                  <select className="form-select" id="parent" name="parent" value={formData.parent} onChange={handleChange}>
                    <option value="">None (Top Level)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} disabled={currentCategory && currentCategory.id === cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="manager-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Close</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
