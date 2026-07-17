import React, { useEffect, useState } from 'react';
import { orderService, inventoryService } from '../services/api';
import { ShoppingCart, Check, RefreshCw, Truck, ArrowUpRight, AlertCircle, Plus } from 'lucide-react';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  
  // Forms
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedProductSku, setSelectedProductSku] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(100);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const ordersData = await orderService.getOrders();
      const suppliersData = await orderService.getSuppliers();
      const inventoryData = await inventoryService.getProducts(undefined, undefined, 1, 1000);
      setOrders(ordersData);
      setSuppliers(suppliersData);
      setProducts(inventoryData.products || []);
    } catch (err) {
      console.error("Failed to load orders data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await orderService.addSupplier({
        name: supplierName,
        contact_email: supplierEmail || null,
        phone: supplierPhone || null,
        address: supplierAddress || null
      });
      setSuccess(`Supplier '${supplierName}' created successfully!`);
      setShowAddSupplierModal(false);
      setSupplierName('');
      setSupplierEmail('');
      setSupplierPhone('');
      setSupplierAddress('');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create supplier.');
    }
  };

  const handleCreatePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!selectedSupplierId || !selectedProductSku) {
      setError("Please select both a supplier and a product.");
      return;
    }
    
    // Find selected product
    const product = products.find(p => p.sku === selectedProductSku);
    if (!product) return;
    
    const cost = product.cost || 10.0;
    const totalAmount = cost * orderQuantity;
    
    try {
      await orderService.createOrder({
        supplier_id: parseInt(selectedSupplierId),
        order_type: 'purchase',
        total_amount: totalAmount,
        items: [{
          product_sku: selectedProductSku,
          quantity: orderQuantity,
          unit_price: cost
        }]
      });
      
      setSuccess(`Replenishment Purchase Order generated successfully!`);
      setShowCreateOrderModal(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create purchase order.');
    }
  };

  const handleMarkCompleted = async (id: number) => {
    try {
      await orderService.updateOrderStatus(id, 'completed');
      setSuccess(`Order marked completed. Inventory stock levels replenished!`);
      loadData();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">Supply Chain & Orders</h2>
          <p className="text-xs md:text-sm text-slate-400">Manage supplier purchase logs, fulfillment states, and partners</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddSupplierModal(true)}
            className="px-4 py-2 border border-[#1f2937]/50 hover:bg-[#181b24] text-slate-300 text-sm font-semibold rounded-xl flex items-center gap-2 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
          
          <button
            onClick={() => setShowCreateOrderModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Generate PO</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-start gap-2 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl flex items-start gap-2 text-sm">
          <Check className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Orders List */}
      <div className="glass-panel rounded-2xl border border-[#1f2937]/30 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#0f1119] border-b border-[#1f2937]/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Order ID / Date</th>
                  <th className="p-4">Supplier / Customer ID</th>
                  <th className="p-4">Order Type</th>
                  <th className="p-4">Items Summary</th>
                  <th className="p-4 text-right">Total Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937]/20 text-slate-300">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#12141f]/35 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-white">PO-{o.id}</p>
                        <p className="text-[10px] text-slate-500">{o.order_date.split('T')[0]}</p>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-medium">
                      {o.supplier_id ? `Supplier #${o.supplier_id}` : `Customer #${o.customer_id}`}
                    </td>
                    <td className="p-4 text-xs">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        o.order_type === 'purchase' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-pink-500/10 text-pink-400'
                      }`}>
                        {o.order_type}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {o.items_json && o.items_json.map((item: any, i: number) => (
                        <div key={i}>{item.product_sku} x {item.quantity}</div>
                      ))}
                    </td>
                    <td className="p-4 text-right font-semibold text-white">${o.total_amount.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        o.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : o.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {o.status === 'completed' ? <Check className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {o.status === 'pending' && o.order_type === 'purchase' && (
                        <button
                          onClick={() => handleMarkCompleted(o.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition active:scale-95"
                        >
                          Complete PO
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No purchase or customer orders recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-[#1f2937]/50 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Register Supplier Partner</h3>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Global Beans Inc"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Contact Email</label>
                <input
                  type="email"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="replenish@globalbeans.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                <input
                  type="text"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="555-0122"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Address</label>
                <input
                  type="text"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="101 Roast St, Seattle WA"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 border border-[#1f2937] rounded-xl text-slate-400 text-sm hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl active:scale-95 transition"
                >
                  Register Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate PO Modal */}
      {showCreateOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-[#1f2937]/50 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Generate Replenishment Order</h3>
            <form onSubmit={handleCreatePurchaseOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Supplier Partner</label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Product to Reorder</label>
                <select
                  required
                  value={selectedProductSku}
                  onChange={(e) => setSelectedProductSku(e.target.value)}
                  className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose SKU --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.sku}>{p.name} (SKU: {p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Reorder Quantity</label>
                <input
                  type="number"
                  required
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateOrderModal(false)}
                  className="px-4 py-2 border border-[#1f2937] rounded-xl text-slate-400 text-sm hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl active:scale-95 transition"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
