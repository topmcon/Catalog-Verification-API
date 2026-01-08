interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  processing: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  partial: 'bg-orange-100 text-orange-800',
  verified: 'bg-green-100 text-green-800',
  flagged: 'bg-yellow-100 text-yellow-800',
  flagged_for_review: 'bg-yellow-100 text-yellow-800',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}
