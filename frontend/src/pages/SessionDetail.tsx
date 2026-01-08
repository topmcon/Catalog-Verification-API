import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';

interface Product {
  originalId: string;
  status: string;
  cleanedData?: {
    ProductName: string;
    SKU: string;
    Price: number;
    PrimaryCategory: string;
  };
  verifiedData?: {
    ProductName: string;
    SKU: string;
    Price: number;
    verificationScore: number;
    corrections: Array<{ field: string; reason: string }>;
  };
}

interface Session {
  sessionId: string;
  status: string;
  totalProducts: number;
  verifiedCount: number;
  failedCount: number;
  flaggedCount: number;
  processingTimeMs: number;
  startedAt: string;
  completedAt?: string;
  exportedToSalesforce: boolean;
}

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'failed' | 'flagged'>('all');

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  async function loadSessionData() {
    // Mock data - in real app would fetch from API
    setSession({
      sessionId: sessionId || '',
      status: 'completed',
      totalProducts: 150,
      verifiedCount: 145,
      failedCount: 2,
      flaggedCount: 3,
      processingTimeMs: 45000,
      startedAt: new Date(Date.now() - 50000).toISOString(),
      completedAt: new Date().toISOString(),
      exportedToSalesforce: false,
    });

    setProducts([
      {
        originalId: 'prod-001',
        status: 'verified',
        cleanedData: {
          ProductName: 'Widget Pro X1',
          SKU: 'WPX-001',
          Price: 99.99,
          PrimaryCategory: 'Electronics',
        },
        verifiedData: {
          ProductName: 'Widget Pro X1',
          SKU: 'WPX-001',
          Price: 99.99,
          verificationScore: 98.5,
          corrections: [],
        },
      },
      {
        originalId: 'prod-002',
        status: 'verified',
        cleanedData: {
          ProductName: 'Gadget Alpha',
          SKU: 'GA-002',
          Price: 149.99,
          PrimaryCategory: 'Electronics',
        },
        verifiedData: {
          ProductName: 'Gadget Alpha',
          SKU: 'GA-002',
          Price: 149.99,
          verificationScore: 95.0,
          corrections: [{ field: 'Description', reason: 'Added missing product details' }],
        },
      },
      {
        originalId: 'prod-003',
        status: 'flagged',
        cleanedData: {
          ProductName: 'Unknown Product',
          SKU: 'UP-003',
          Price: 0,
          PrimaryCategory: 'Uncategorized',
        },
      },
      {
        originalId: 'prod-004',
        status: 'failed',
        cleanedData: {
          ProductName: '',
          SKU: '',
          Price: -10,
          PrimaryCategory: '',
        },
      },
    ]);

    setLoading(false);
  }

  const filteredProducts = products.filter(p => {
    if (activeTab === 'all') return true;
    return p.status === activeTab;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    return <div>Session not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link to="/sessions" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Sessions
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{session.sessionId}</h1>
              <StatusBadge status={session.status} />
            </div>
            <p className="text-gray-500 mt-1">
              Started {format(new Date(session.startedAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry Failed
            </button>
            <button className="btn-primary flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Export to Salesforce
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold">{session.totalProducts}</p>
          <p className="text-sm text-gray-500">Total Products</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{session.verifiedCount}</p>
          <p className="text-sm text-gray-500">Verified</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-600">{session.failedCount}</p>
          <p className="text-sm text-gray-500">Failed</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-600">{session.flaggedCount}</p>
          <p className="text-sm text-gray-500">Flagged</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
          {(['all', 'verified', 'failed', 'flagged'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-0.5">
                {tab === 'all' ? products.length : products.filter(p => p.status === tab).length}
              </span>
            </button>
          ))}
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product ID</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">SKU</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Price</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Score</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.originalId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <span className="font-mono text-sm">{product.originalId}</span>
                </td>
                <td className="py-4 px-4">
                  {product.cleanedData?.ProductName || '-'}
                </td>
                <td className="py-4 px-4">
                  <span className="font-mono text-sm">{product.cleanedData?.SKU || '-'}</span>
                </td>
                <td className="py-4 px-4">
                  {product.cleanedData?.Price !== undefined 
                    ? `$${product.cleanedData.Price.toFixed(2)}`
                    : '-'
                  }
                </td>
                <td className="py-4 px-4">
                  {product.cleanedData?.PrimaryCategory || '-'}
                </td>
                <td className="py-4 px-4">
                  {product.verifiedData?.verificationScore 
                    ? `${product.verifiedData.verificationScore.toFixed(1)}%`
                    : '-'
                  }
                </td>
                <td className="py-4 px-4">
                  <StatusBadge status={product.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
