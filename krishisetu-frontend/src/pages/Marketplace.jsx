import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getProducts, createOrder } from '../services/api';

export default function Marketplace() {
  const { t, farmer, cart, addToCart, removeFromCart, clearCart, showToast } = useApp();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    getProducts()
      .then((res) => {
        if (res.success && res.data) {
          setProducts(res.data);
        }
      })
      .catch((err) => {
        console.log('Products fallback loaded', err);
        // Fallback default catalog
        setProducts([
          {
            id: 'chem-mancozeb',
            name: 'Mancozeb 75% WP (Dithane M-45)',
            category: 'fungicides',
            price: 280,
            mrp: 320,
            unit: '500g Pack',
            rating: 4.8,
            reviewsCount: 142,
            stock: 35,
            dealer: 'Kolar Kisan Seva Kendra (3.2 km)',
            imageEmoji: '🧪',
            description: 'Broad-spectrum protective contact fungicide. Highly effective against Early & Late Blight in tomato.',
          },
          {
            id: 'bio-trichoderma',
            name: 'Trichoderma harzianum 2% WP',
            category: 'bio-pesticides',
            price: 190,
            mrp: 230,
            unit: '1 kg Pack',
            rating: 4.9,
            reviewsCount: 88,
            stock: 24,
            dealer: 'Vokkaleri Raitha Samparka Kendra (1.5 km)',
            imageEmoji: '🌱',
            description: 'Organic biological bio-agent for soil application and foliar spraying against fungal pathogens.',
          },
          {
            id: 'chem-azoxystrobin',
            name: 'Azoxystrobin 23% SC (Amistar)',
            category: 'fungicides',
            price: 640,
            mrp: 720,
            unit: '200ml Bottle',
            rating: 4.7,
            reviewsCount: 65,
            stock: 12,
            dealer: 'Kolar Kisan Seva Kendra (3.2 km)',
            imageEmoji: '🔬',
            description: 'Systemic broad-spectrum fungicide with translaminar movement for curative disease control.',
          },
          {
            id: 'equip-sprayer',
            name: '16L Battery Knapsack Sprayer',
            category: 'equipment',
            price: 2450,
            mrp: 3200,
            unit: '1 Unit',
            rating: 4.6,
            reviewsCount: 310,
            stock: 8,
            dealer: 'Agri-Tech Solutions Kolar',
            imageEmoji: '🎒',
            description: '12V 8Ah battery-operated sprayer with brass lance and 4 interchangeable nozzles. Eligible for 50% govt subsidy.',
          },
          {
            id: 'bio-neem',
            name: 'Neem Oil 10,000 PPM (Azadirachtin)',
            category: 'bio-pesticides',
            price: 360,
            mrp: 420,
            unit: '500ml Bottle',
            rating: 4.8,
            reviewsCount: 112,
            stock: 40,
            dealer: 'Green Roots Organics Kolar',
            imageEmoji: '🍃',
            description: 'Natural botanical insecticide & repellent for whitefly, aphids, and leaf miners in vegetables.',
          },
        ]);
      });
  }, []);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handlePlaceOrder = async () => {
    try {
      await createOrder({
        farmerId: farmer.name,
        items: cart,
        totalAmount: cartTotal,
        deliveryAddress: `${farmer.village}, ${farmer.district}, Karnataka`,
      });
    } catch (e) {
      console.log('Order mock submission');
    }
    setOrderSuccess(true);
    clearCart();
    showToast(t.orderSuccess);
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '20px 16px 90px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Cart summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0 }}>
            🛒 KrishiSetu Agri-Input Store
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '4px 0 0 0' }}>
            Verified fertilizers, fungicides, and bio-inputs directly from authorized dealers in Kolar.
          </p>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => setShowCheckout(!showCheckout)}
            style={{
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-glow-sm)',
            }}
          >
            <span>🛒 View Cart ({cart.reduce((a, b) => a + b.qty, 0)})</span>
            <span>• ₹{cartTotal}</span>
          </button>
        )}
      </div>

      {/* Cart Checkout Drawer / Modal if active */}
      {showCheckout && (
        <div style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--green-600)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>🛍️ Your Order Summary</h3>
            <button
              type="button"
              onClick={() => setShowCheckout(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16 }}
            >
              ✕ Close
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {cart.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card2)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹{item.price} × {item.qty}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 800, color: 'var(--green-400)' }}>₹{item.price * item.qty}</span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--red-400)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg-card2)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>Delivery to:</span>
              <strong style={{ color: '#fff' }}>{farmer.name}, {farmer.village}, {farmer.district}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <span>Total Payable Amount:</span>
              <span style={{ color: 'var(--green-400)' }}>₹{cartTotal}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={handlePlaceOrder}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: 15,
              }}
            >
              ✅ Confirm Order (Pay on Delivery / UPI)
            </button>
          </div>
        </div>
      )}

      {orderSuccess && (
        <div style={{
          background: 'rgba(34,197,94,0.12)',
          border: '1px solid rgba(34,197,94,0.35)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          color: 'var(--green-400)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>🎉</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{t.orderSuccess}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Dealer (Kolar Kisan Seva Kendra) will deliver directly to your farm within 24 hours.
            </div>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'all', label: 'All Products' },
          { id: 'fungicides', label: '🧪 Fungicides' },
          { id: 'bio-pesticides', label: '🌱 Bio-Pesticides' },
          { id: 'equipment', label: '🎒 Spray Equipment' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              border: '1px solid var(--border)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: selectedCategory === cat.id ? 'var(--green-600)' : 'var(--bg-card2)',
              color: selectedCategory === cat.id ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product Catalog Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 32 }}>{p.imageEmoji || '📦'}</span>
                <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.12)', color: 'var(--green-400)', padding: '2px 8px', borderRadius: 10 }}>
                  In Stock ({p.stock})
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '10px 0 4px 0' }}>{p.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {p.description}
              </p>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                📍 {p.dealer}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
                  ₹{p.price}
                </span>
                {p.mrp && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ₹{p.mrp}
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>/ {p.unit}</span>
              </div>
              <button
                type="button"
                onClick={() => addToCart(p)}
                style={{
                  width: '100%',
                  background: 'var(--bg-card2)',
                  color: 'var(--green-400)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  padding: '9px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'var(--transition)',
                }}
              >
                <span>+ Add to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
