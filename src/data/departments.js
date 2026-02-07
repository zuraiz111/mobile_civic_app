export const departments = [
  { id: 'Garbage', name: 'Garbage', icon: '🗑️', color: '#22c55e' },
  { id: 'Electricity', name: 'Electricity', icon: '⚡', color: '#eab308' },
  { id: 'Water', name: 'Water Supply', icon: '💧', color: '#3b82f6' },
  { id: 'Gas', name: 'Sui Gas', icon: '🔥', color: '#f97316' },
  { id: 'Roads', name: 'Roads & Infrastructure', icon: '🛣️', color: '#6b7280' },
  { id: 'Sewerage', name: 'Sewerage', icon: '🚰', color: '#14b8a6' },
  { id: 'Streetlights', name: 'Street Lights', icon: '💡', color: '#f59e0b' },
  { id: 'Other', name: 'Other', icon: '📋', color: '#8b5cf6' },
];

export const categories = [
  { id: 'Garbage', label: 'Garbage', icon: '🗑️' },
  { id: 'Electricity', label: 'Electric', icon: '⚡' },
  { id: 'Water', label: 'Water', icon: '💧' },
  { id: 'Gas', label: 'Gas', icon: '🔥' },
  { id: 'Roads', label: 'Roads', icon: '🛣️' },
  { id: 'Sewerage', label: 'Sewage', icon: '🚰' },
  { id: 'Streetlights', label: 'Lights', icon: '💡' },
  { id: 'Other', label: 'Other', icon: '📋' },
];

export const statusColors = {
  'Pending': { bg: '#fef3c7', text: '#b45309' },
  'Assigned': { bg: '#dbeafe', text: '#1d4ed8' },
  'In Progress': { bg: '#ede9fe', text: '#7c3aed' },
  'Resolved': { bg: '#dcfce7', text: '#15803d' },
  'Closed': { bg: '#f3f4f6', text: '#4b5563' },
};

export const getStatusColor = (status, isDark = false) => {
  const key = status || 'Pending';
  const normalizedKey = Object.keys(statusColors).find(k => k.toLowerCase() === key.toLowerCase()) || 'Pending';
  
  if (!isDark) {
    return statusColors[normalizedKey];
  }

  // Dark mode colors
  const darkColors = {
    'Pending': { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
    'Assigned': { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' },
    'In Progress': { bg: 'rgba(139, 92, 246, 0.2)', text: '#a78bfa' },
    'Resolved': { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80' },
    'Closed': { bg: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af' },
  };

  return darkColors[normalizedKey];
};

export const landmarks = [
  { id: 'city_hall', name: 'City Hall', icon: '🏛️' },
  { id: 'central_park', name: 'Central Park', icon: '🌳' },
  { id: 'main_market', name: 'Main Market', icon: '🏪' },
  { id: 'hospital', name: 'General Hospital', icon: '🏥' },
  { id: 'bus_station', name: 'Bus Station', icon: '🚌' },
];

export const statuses = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
