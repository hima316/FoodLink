import { useEffect, useState } from 'react';
import { ArrowLeftRight, Leaf, Drumstick } from 'lucide-react';
import { API, useAuth } from '../context/AuthContext';
import { formatDate, formatQuantity } from '../utils/helpers';

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/transactions')
      .then(r => setTransactions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-gray-900">Transaction History</h1>
        <p className="text-gray-500 mt-1">Complete record of food allocations</p>
      </div>

      {transactions.length === 0 ? (
        <div className="card text-center py-16">
          <ArrowLeftRight size={48} className="mx-auto mb-4 text-gray-200" />
          <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">No transactions yet</h3>
          <p className="text-gray-400">Completed food allocations will appear here.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Food Item</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">
                    {user.role === 'donor' ? 'NGO' : 'Donor'}
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Quantity</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx, i) => (
                  <tr key={tx.transaction_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {tx.is_veg
                          ? <Leaf size={14} className="text-brand-600 shrink-0" />
                          : <Drumstick size={14} className="text-red-500 shrink-0" />
                        }
                        <span className="font-medium text-gray-800">{tx.food_name}</span>
                      </div>
                      <div className="text-xs text-gray-400 ml-5">TX-{String(tx.transaction_id).padStart(6, '0')}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-700">
                        {user.role === 'donor' ? tx.ngo_name : tx.donor_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {user.role === 'donor' ? tx.ngo_contact : tx.donor_contact}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-brand-700">
                        {formatQuantity(tx.allocated_quantity, tx.unit)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-gray-500 text-xs">
                      {formatDate(tx.completed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
            <span>{transactions.length} transactions total</span>
            <span>
              Total: {transactions.reduce((sum, tx) => sum + parseFloat(tx.allocated_quantity || 0), 0).toFixed(2)} kg equivalent
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
