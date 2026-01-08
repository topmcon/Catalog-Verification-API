import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertCircle, CheckCircle, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';

interface EnrichedProduct {
  category: {
    categoryName: string;
    department: string;
    confidence: number;
  };
  title: string;
  description: string;
  attributes: Record<string, any>;
  missingAttributes: string[];
  taxonomyTiers?: {
    tier1: string;
    tier2: string;
    tier3: string;
    tier4?: string;
  };
}

interface EnrichmentResult {
  success: boolean;
  product?: EnrichedProduct;
  error?: string;
  processingTimeMs?: number;
}

export default function Enrich() {
  const navigate = useNavigate();
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnrichmentResult | null>(null);
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [showRawResponse, setShowRawResponse] = useState(false);

  const sampleSingleProduct = JSON.stringify({
    brand: "Sub-Zero",
    category: "Refrigerator",
    modelNumber: "BI-36UFD",
    width: "36",
    configuration: "French Door",
    installationType: "Built-In",
    finish: "Stainless Steel",
    totalCapacity: "21.4",
    features: ["Panel Ready", "Ice Maker", "WiFi"]
  }, null, 2);

  const sampleBatchProducts = JSON.stringify({
    products: [
      {
        brand: "Sub-Zero",
        category: "Refrigerator",
        modelNumber: "BI-36UFD",
        width: "36",
        configuration: "French Door",
        installationType: "Built-In",
        finish: "Stainless Steel"
      },
      {
        brand: "Wolf",
        category: "Range",
        modelNumber: "DF486G",
        width: "48",
        fuelType: "Dual Fuel",
        installationType: "Freestanding",
        numberOfBurners: "6",
        finish: "Stainless Steel"
      }
    ]
  }, null, 2);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      if (!jsonInput.trim()) {
        throw new Error('Please provide product data');
      }

      const data = JSON.parse(jsonInput);
      const endpoint = mode === 'single' ? '/api/enrich/single' : '/api/enrich';
      const response = await api.post(endpoint, data);
      
      if (mode === 'single') {
        setResult(response.data);
      } else {
        // For batch, navigate to session details
        if (response.data.success) {
          navigate(`/sessions/${response.data.sessionId}`);
        } else {
          throw new Error(response.data.error || 'Enrichment failed');
        }
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your input.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  function loadSampleData() {
    setJsonInput(mode === 'single' ? sampleSingleProduct : sampleBatchProducts);
    setResult(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary-600" />
          Enrich Products
        </h1>
        <p className="text-gray-500 mt-1">
          Transform raw product data into standardized catalog entries with AI-powered enrichment
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6 flex gap-4">
        <button
          type="button"
          onClick={() => { setMode('single'); setResult(null); setJsonInput(''); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'single' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Single Product
        </button>
        <button
          type="button"
          onClick={() => { setMode('batch'); setResult(null); setJsonInput(''); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'batch' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Batch Processing
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  {mode === 'single' ? 'Product Data' : 'Products Array'}
                </h3>
                <button
                  type="button"
                  onClick={loadSampleData}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Load sample data
                </button>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={mode === 'single' 
                  ? '{"brand": "...", "category": "...", ...}' 
                  : '{"products": [...]}'}
                className="input font-mono text-sm h-80 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !jsonInput.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enriching...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {mode === 'single' ? 'Enrich Product' : 'Process Batch'}
                </>
              )}
            </button>
          </form>

          {/* Expected Format */}
          <div className="card mt-6">
            <h3 className="font-semibold mb-4">Supported Fields</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 px-2 py-1 rounded">brand</div>
              <div className="bg-gray-50 px-2 py-1 rounded">category</div>
              <div className="bg-gray-50 px-2 py-1 rounded">modelNumber</div>
              <div className="bg-gray-50 px-2 py-1 rounded">width</div>
              <div className="bg-gray-50 px-2 py-1 rounded">height</div>
              <div className="bg-gray-50 px-2 py-1 rounded">depth</div>
              <div className="bg-gray-50 px-2 py-1 rounded">configuration</div>
              <div className="bg-gray-50 px-2 py-1 rounded">installationType</div>
              <div className="bg-gray-50 px-2 py-1 rounded">finish</div>
              <div className="bg-gray-50 px-2 py-1 rounded">color</div>
              <div className="bg-gray-50 px-2 py-1 rounded">fuelType</div>
              <div className="bg-gray-50 px-2 py-1 rounded">features</div>
              <div className="bg-gray-50 px-2 py-1 rounded">totalCapacity</div>
              <div className="bg-gray-50 px-2 py-1 rounded">material</div>
            </div>
          </div>
        </div>

        {/* Result Panel */}
        <div>
          {result && result.success && result.product && (
            <div className="space-y-4">
              {/* Success Header */}
              <div className="card bg-green-50 border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Enrichment Complete</p>
                    <p className="text-sm text-green-600">
                      Processed in {result.processingTimeMs}ms
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Match */}
              <div className="card">
                <h3 className="font-semibold mb-3">Category Match</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{result.product.category.categoryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{result.product.category.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-medium text-green-600">
                      {(result.product.category.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                {result.product.taxonomyTiers && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-500 mb-2">Taxonomy</p>
                    <div className="flex flex-wrap gap-1 text-sm">
                      <span className="bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                        {result.product.taxonomyTiers.tier1}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                        {result.product.taxonomyTiers.tier2}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                        {result.product.taxonomyTiers.tier3}
                      </span>
                      {result.product.taxonomyTiers.tier4 && (
                        <>
                          <span className="text-gray-400">→</span>
                          <span className="bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                            {result.product.taxonomyTiers.tier4}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Generated Title */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Generated Title</h3>
                  <button
                    onClick={() => copyToClipboard(result.product!.title)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-lg font-medium text-primary-700">
                  {result.product.title}
                </p>
              </div>

              {/* Generated Description */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Generated Description</h3>
                  <button
                    onClick={() => copyToClipboard(result.product!.description)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-700 whitespace-pre-line">
                  {result.product.description}
                </p>
              </div>

              {/* Missing Attributes */}
              {result.product.missingAttributes.length > 0 && (
                <div className="card border-yellow-200 bg-yellow-50">
                  <h3 className="font-semibold mb-3 text-yellow-800">Missing Attributes</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.product.missingAttributes.slice(0, 10).map((attr, i) => (
                      <span key={i} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">
                        {attr}
                      </span>
                    ))}
                    {result.product.missingAttributes.length > 10 && (
                      <span className="text-yellow-600 text-sm">
                        +{result.product.missingAttributes.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Raw Response Toggle */}
              <button
                onClick={() => setShowRawResponse(!showRawResponse)}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-2"
              >
                {showRawResponse ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showRawResponse ? 'Hide' : 'Show'} Raw Response
              </button>

              {showRawResponse && (
                <div className="card bg-gray-900 text-gray-100">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {result && !result.success && (
            <div className="card border-red-200 bg-red-50">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Enrichment Failed</p>
                  <p className="text-sm text-red-600">{result.error}</p>
                </div>
              </div>
            </div>
          )}

          {!result && (
            <div className="card text-center py-12 text-gray-400">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Submit product data to see enrichment results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
