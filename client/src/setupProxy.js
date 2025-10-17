const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Use REACT_APP_API_URL when available (set by docker-compose or env)
  const target = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Proxy /api requests and rewrite to backend API version
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api/v1',
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying:', req.method, req.path, '->', proxyReq.path);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        // fallback response for dev server
        try {
          res.status(500).json({ error: 'Proxy error', details: err.message });
        } catch (e) {
          console.error('Failed to send proxy error response', e);
        }
      },
      logLevel: 'debug',
    })
  );

  // Proxy static uploads (so e.g. /uploads/xxx can be served from backend)
  app.use(
    '/uploads',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying upload:', req.method, req.path, '->', proxyReq.path);
      },
      onError: (err, req, res) => {
        console.error('Proxy error (uploads):', err);
        try {
          res.status(500).json({ error: 'Proxy error', details: err.message });
        } catch (e) {
          console.error('Failed to send proxy error response', e);
        }
      },
      logLevel: 'debug',
    })
  );
};