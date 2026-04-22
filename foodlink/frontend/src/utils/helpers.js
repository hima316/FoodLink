export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const timeUntilExpiry = (expiry) => {
  const now = new Date();
  const exp = new Date(expiry);
  const diff = exp - now;
  if (diff <= 0) return { text: 'Expired', urgent: false, expired: true };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const urgent = hours < 5;
  if (hours === 0) return { text: `${mins}m left`, urgent, expired: false };
  if (hours < 24) return { text: `${hours}h ${mins}m left`, urgent, expired: false };
  const days = Math.floor(hours / 24);
  return { text: `${days}d ${hours % 24}h left`, urgent, expired: false };
};

export const getPriorityLabel = (score) => {
  if (score === 4) return { label: 'Expiring Soon', color: 'text-orange-600 bg-orange-50' };
  if (score === 3) return { label: 'Near You', color: 'text-brand-700 bg-brand-50' };
  if (score === 2) return { label: 'Same City', color: 'text-blue-700 bg-blue-50' };
  if (score === 1) return { label: 'Same State', color: 'text-purple-700 bg-purple-50' };
  return null;
};

export const getStatusColor = (status) => {
  const map = {
    available: 'text-green-700 bg-green-100',
    partially_allocated: 'text-blue-700 bg-blue-100',
    fully_allocated: 'text-gray-600 bg-gray-100',
    expired: 'text-red-600 bg-red-100',
    pending: 'text-yellow-700 bg-yellow-100',
    approved: 'text-green-700 bg-green-100',
    partially_approved: 'text-blue-700 bg-blue-100',
    rejected: 'text-red-600 bg-red-100',
    cancelled: 'text-gray-500 bg-gray-100',
  };
  return map[status] || 'text-gray-500 bg-gray-100';
};

export const formatQuantity = (qty, unit) => `${parseFloat(qty).toFixed(1)} ${unit || 'kg'}`;
