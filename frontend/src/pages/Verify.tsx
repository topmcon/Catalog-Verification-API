import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileJson, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function Verify() {
  const navigate = useNavigate();
  const [jsonInput, setJsonInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleData = JSON.stringify({
    products: [
      {
        id: "prod123",
        name: "Widget X",
        description: "A high-quality widget.",
        attributes: { color: "red", size: "medium", material: "plastic" },
        category: "Electronics",
        price: 99.99,
        sku: "WID-001"
      }
    ]
  }, null, 2);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let data;
      
      if (file) {
        const text = await file.text();
        data = JSON.parse(text);
      } else if (jsonInput) {
        data = JSON.parse(jsonInput);
      } else {
        throw new Error('Please provide JSON data or upload a file');
      }

      const response = await api.post('/api/verify', data);
      
      if (response.data.success) {
        navigate(`/sessions/${response.data.sessionId}`);
      } else {
        throw new Error(response.data.error?.message || 'Verification failed');
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
        setFile(selectedFile);
        setJsonInput('');
      } else {
        setError('Please select a JSON file');
      }
    }
  }

  function loadSampleData() {
    setJsonInput(sampleData);
    setFile(null);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Verify Products</h1>
        <p className="text-gray-500 mt-1">
          Submit product data for AI-powered verification and cleaning
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
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

            {/* File Upload */}
            <div className="card mb-6">
              <h3 className="font-semibold mb-4">Upload JSON File</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  {file ? (
                    <p className="text-primary-600 font-medium">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-400 mt-1">JSON files only</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* JSON Input */}
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Or Paste JSON Data</h3>
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
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setFile(null);
                }}
                placeholder='{"products": [...]}'
                className="input font-mono text-sm h-64 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!jsonInput && !file)}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FileJson className="w-5 h-5" />
                  Start Verification
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Panel */}
        <div className="card h-fit">
          <h3 className="font-semibold mb-4">Expected Format</h3>
          <p className="text-sm text-gray-600 mb-4">
            Submit your product data in the following JSON format:
          </p>
          <pre className="bg-gray-100 rounded-lg p-4 text-xs overflow-x-auto">
{`{
  "products": [
    {
      "id": "prod123",
      "name": "Widget X",
      "description": "Description...",
      "category": "Electronics",
      "price": 99.99,
      "sku": "WID-001",
      "attributes": {
        "color": "red",
        "size": "medium"
      }
    }
  ]
}`}
          </pre>

          <h4 className="font-medium mt-6 mb-3">Required Fields</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• <code className="bg-gray-100 px-1 rounded">id</code> - Unique product identifier</li>
            <li>• <code className="bg-gray-100 px-1 rounded">name</code> - Product name</li>
          </ul>

          <h4 className="font-medium mt-6 mb-3">Optional Fields</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• <code className="bg-gray-100 px-1 rounded">description</code></li>
            <li>• <code className="bg-gray-100 px-1 rounded">category</code></li>
            <li>• <code className="bg-gray-100 px-1 rounded">price</code></li>
            <li>• <code className="bg-gray-100 px-1 rounded">sku</code></li>
            <li>• <code className="bg-gray-100 px-1 rounded">attributes</code> - Custom key-value pairs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
