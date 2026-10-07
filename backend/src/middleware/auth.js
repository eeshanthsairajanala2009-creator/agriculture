// Middleware: Auth verification using Supabase JWT
const { createClient } = require('@supabase/supabase-js');

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    // Demo mode: attach mock user
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'farmer.ramesh@krishisetu.io',
      role: 'farmer',
    };
    return next();
  }
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token validation failed' });
  }
};

// Optional auth — attaches user if token present but doesn't block
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  const token = authHeader.split(' ')[1];
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data: { user } } = await supabase.auth.getUser(token);
    req.user = user;
  } catch (_) {}
  next();
};

module.exports = { requireAuth, optionalAuth };
