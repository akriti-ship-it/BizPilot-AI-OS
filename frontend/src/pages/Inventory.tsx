import React, { useEffect, useState } from 'react';
import { inventoryService } from '../services/api';
import { Package, Plus, Trash2, Edit2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Ingredients');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  
  // Stock adjustment states
  const [stockLevel, setStockLevel] = useState(0);
  const [safetyThreshold, setSafetyThreshold] = useState(10);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getProducts(searchTerm, filterCategory, page, limit);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [searchTerm, filterCategory, page]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await inventoryService.addProduct({
        name,
        sku: sku.toUpperCase(),
        category,
        price: parseFloat(price),
        cost: parseFloat(cost),
        description
      });
      
      setSuccess(`Product '${name}' registered successfully!`);
      setShowAddModal(false);
      // Reset form
      setName('');
      setSku('');
      setPrice('');
      setCost('');
      setDescription('');
      fetchInventory();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register product.');
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!selectedProduct) return;
    
    try {
      await inventoryService.updateStock(selectedProduct.id, stockLevel, safetyThreshold);
      setSuccess(`Stock for '${selectedProduct.name}' updated successfully!`);
      setShowStockModal(false);
      fetchInventory();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update stock.');
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete '${name}' from catalog?`)) return;
    try {
      await inventoryService.deleteProduct(id);
      setSuccess(`Product deleted successfully.`);
      fetchInventory();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">Inventory Manager</h2>
          <p className="text-xs md:text-sm text-slate-400">Track and replenishment logistics records dynamically</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={fetchInventory}
            className="p-2.5 rounded-xl bg-slate-900 border border-[#1f2937]/50 hover:bg-[#181b24] text-slate-400 hover:text-slate-200 transition"
            title="Refresh database"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl flex items-start gap-2 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl flex items-start gap-2 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#0d0f17] border border-[#1f2937]/30 rounded-2xl p-4 shadow-md">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Ingredients">Ingredients</option>
            <option value="Packaging">Packaging</option>
            <option value="Equipment">Equipment</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="glass-panel rounded-2xl border border-[#1f2937]/30 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#0f1119] border-b border-[#1f2937]/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Product Details</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Cost</th>
                  <th className="p-4 text-right">Price</th>
                  <th className="p-4 text-center">Stock / Safety</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937]/20 text-slate-300">
                {products.map((p) => {
                  const isLow = p.stock_level <= p.safety_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-[#12141f]/35 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isLow ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'} border border-white/5`}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{p.name}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{p.description || 'No description'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs">{p.sku}</td>
                      <td className="p-4 text-xs font-medium text-slate-400">{p.category}</td>
                      <td className="p-4 text-right">${p.cost.toFixed(2)}</td>
                      <td className="p-4 text-right">${p.price.toFixed(2)}</td>
                      <td className="p-4 text-center font-mono text-xs">
                        <span className={`font-bold ${isLow ? 'text-red-400' : 'text-slate-200'}`}>{p.stock_level}</span>
                        <span className="text-slate-500"> / {p.safety_threshold}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isLow 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isLow ? 'Low Stock' : 'Healthy'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setStockLevel(p.stock_level);
                              setSafetyThreshold(p.safety_threshold);
                              setShowStockModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition"
                            title="Adjust Stock"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No products registered. Click Add Product to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
            {/* Pagination Controls */}
            <div className="bg-[#0f1119] border-t border-[#1f2937]/40 px-4 py-3 flex items-center justify-between sm:px-6 shrink-0 text-xs">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="relative inline-flex items-center px-4 py-2 border border-[#1f2937] text-sm font-medium rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(p => p + 1)}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-[#1f2937] text-sm font-medium rounded-xl text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-slate-400">
                    Showing <span className="font-semibold text-white">{Math.min(total, (page - 1) * limit + 1)}</span> to{' '}
                    <span className="font-semibold text-white">{Math.min(total, page * limit)}</span> of{' '}
                    <span className="font-semibold text-white">{total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="relative inline-flex items-center px-3 py-1.5 rounded-l-xl border border-[#1f2937] bg-slate-900 text-slate-400 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-1.5 border-t border-b border-[#1f2937] bg-slate-900 text-slate-200">
                      {page}
                    </span>
                    <button
                      disabled={page * limit >= total}
                      onClick={() => setPage(p => p + 1)}
                      className="relative inline-flex items-center px-3 py-1.5 rounded-r-xl border border-[#1f2937] bg-slate-900 text-slate-400 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-[#1f2937]/50 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Register New Product</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Premium Coffee Beans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="COF-BEANS"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Ingredients">Ingredients</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Equipment">Equipment</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="7.50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="18.75"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Organic medium-roasted..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#1f2937] rounded-xl text-slate-400 text-sm hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl active:scale-95 transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-[#1f2937]/50 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">Adjust Stock Levels</h3>
            <p className="text-xs text-slate-400 mb-4">{selectedProduct.name} ({selectedProduct.sku})</p>
            
            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Stock Level</label>
                <input
                  type="number"
                  required
                  value={stockLevel}
                  onChange={(e) => setStockLevel(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Safety Threshold Limits</label>
                <input
                  type="number"
                  required
                  value={safetyThreshold}
                  onChange={(e) => setSafetyThreshold(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 border border-[#1f2937] rounded-xl text-slate-400 text-sm hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl active:scale-95 transition"
                >
                  Update Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
