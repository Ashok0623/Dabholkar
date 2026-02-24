import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  business,
  serviceHighlights,
  testimonials
} from './data';
import './App.css';

const SHEET_URL =
  import.meta.env.VITE_SHEET_URL ||
  'YOUR_PUBLISHED_CSV_URL_HERE';

const SECTION_ORDER = ['Groceries', 'Fruits', 'Vegetables', 'Dairy Products'];

const normalizeCategory = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'groceries' || raw === 'grocery') return 'Groceries';
  if (raw === 'fruits' || raw === 'fruit') return 'Fruits';
  if (raw === 'vegetables' || raw === 'vegetable') return 'Vegetables';
  if (raw === 'dairy products' || raw === 'dairy' || raw === 'dairy product') return 'Dairy Products';
  return 'Groceries';
};

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState({});
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    if (!SHEET_URL || SHEET_URL === 'YOUR_PUBLISHED_CSV_URL_HERE') {
      setLoadError('Set VITE_SHEET_URL with your published Google Sheet CSV link.');
      setLoading(false);
      return;
    }

    Papa.parse(SHEET_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleanData = results.data
          .map((item, index) => ({
            id: String(item.id || `item-${index + 1}`).trim(),
            name: String(item.name || '').trim(),
            unit: String(item.unit || '').trim(),
            category: normalizeCategory(item.category),
            price: parseFloat(item.price) || 0,
            available:
              String(item.available || '')
                .trim()
                .toUpperCase() === 'TRUE'
                ? 'TRUE'
                : 'FALSE'
          }))
          .filter((item) => item.id && item.name);

        setCatalog(cleanData);
        setLoading(false);
      },
      error: (error) => {
        setLoadError(error?.message || 'Failed to fetch catalog from Google Sheets.');
        setLoading(false);
      }
    });
  }, []);

  const navItems = [
    { href: '#home', label: 'Home' },
    { href: '#shop', label: 'Organic Shop' },
    { href: '#about', label: 'About Us' },
    { href: '#delivery', label: 'Delivery Info' },
    { href: '#testimonials', label: 'Testimonials' },
    { href: '#contact', label: 'Contact' }
  ];

  const availableCatalog = useMemo(
    () => catalog.filter((item) => item.available === 'TRUE'),
    [catalog]
  );

  const categories = useMemo(() => {
    const groups = {
      Groceries: [],
      Fruits: [],
      Vegetables: [],
      'Dairy Products': []
    };
    availableCatalog.forEach((item) => {
      const category = normalizeCategory(item.category);
      groups[category].push(item);
    });
    return SECTION_ORDER.map((name) => ({
      title: name,
      items: groups[name] || []
    }));
  }, [availableCatalog]);

  const cartCount = Object.values(cart).reduce((sum, value) => sum + value, 0);

  const addToCart = (id) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id) => {
    setCart((prev) => {
      const next = { ...prev };
      if (!next[id]) return next;
      if (next[id] === 1) {
        delete next[id];
        return next;
      }
      next[id] -= 1;
      return next;
    });
  };

  const buildWhatsAppText = () => {
    const byId = new Map(catalog.map((item) => [item.id, item]));
    const lines = [
      'Hi Dabholkar Stores, I want to order these items:',
      '',
      ...Object.entries(cart).map(([id, qty]) => {
        const item = byId.get(id);
        if (!item) return `- ${id} x ${qty}`;
        const priceText = item.price > 0 ? ` | INR ${item.price}` : '';
        return `- ${item.name} (${item.unit}) x ${qty}${priceText}`;
      }),
      '',
      'Please share availability and delivery timeline.'
    ];
    return lines.join('\n');
  };

  const openWhatsApp = (text) => {
    const whatsappNumber = '9666136942';
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const handleCartOrder = () => {
    if (cartCount === 0) {
      openWhatsApp('Hi Dabholkar Stores, I want to place an order. Please share today\'s available items.');
      return;
    }
    openWhatsApp(buildWhatsAppText());
  };

  if (loading) {
    return <div className="loading-state">Loading Fresh Stock...</div>;
  }

  return (
    <>
      <header className="site-header">
        <div className="container nav-wrap">
          <a className="brand" href="#home" aria-label="Dabholkar Stores home">
            <span className="brand-badge">DS</span>
            <span className="brand-text">{business.name}</span>
          </a>

          <button
            className="menu-btn"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            Menu
          </button>

          <nav className={`nav ${menuOpen ? 'open' : ''}`}>
            {navItems.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="badge-strip">
        <div className="container badge-grid">
          <span>{business.ratingGoogle} Rated</span>
          <span>GST Registered</span>
          <span>Organic Specialist</span>
        </div>
      </div>

      <main>
        <section id="home" className="hero section">
          <div className="container hero-grid">
            <div>
              <p className="eyebrow">Gandhinagar Main Road, Hyderabad</p>
              <h1>Fresh Organic Groceries Delivered to Your Doorstep in Gandhi Nagar</h1>
              <p className="lead">
                Trusted by local families for chemical-free grains, fresh vegetables, and specialty chocolates with friendly in-store service and dependable home delivery.
              </p>

              <div className="hero-cta">
                <button className="btn primary" onClick={handleCartOrder}>Order via WhatsApp</button>
                <a className="btn ghost" href={`tel:${business.phone}`}>Call +91 80444 64801</a>
              </div>

              <ul className="hero-metrics">
                <li><strong>{business.ratingGoogle}</strong><span>Google Rating</span></li>
                <li><strong>{business.reviewsGoogle}</strong><span>Customer Reviews</span></li>
                <li><strong>7 AM - 11 PM</strong><span>Open Daily</span></li>
              </ul>
            </div>

            <aside className="hero-card">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
                alt="Fresh organic produce display"
                loading="lazy"
              />
              <p>
                Organic-first local store with clean interiors, attentive staff, and direct WhatsApp ordering.
              </p>
            </aside>
          </div>
        </section>

        <section id="shop" className="section">
          <div className="container">
            <p className="eyebrow">Organic Shop</p>
            <h2>Categorized chemical-free essentials</h2>

            {loadError && <p className="load-error">{loadError}</p>}

            <div className="category-grid">
              {categories.map((category) => (
                <article className="card" key={category.title}>
                  <h3>{category.title}</h3>
                  <ul className="list">
                    {category.items.length === 0 && <li>No items listed yet.</li>}
                    {category.items.map((item) => <li key={item.id}>{item.name} ({item.unit})</li>)}
                  </ul>
                </article>
              ))}
            </div>

            <h3 className="shop-subhead">Quick Order Cart</h3>
            <div className="cart-grid">
              {availableCatalog.map((item) => (
                <article className="card cart-item" key={item.id}>
                  <h4>{item.name}</h4>
                  <p>{item.unit}{item.price > 0 ? ` | INR ${item.price}` : ''}</p>
                  <div className="qty-controls">
                    <button className="btn tiny ghost" onClick={() => removeFromCart(item.id)}>-</button>
                    <span>{cart[item.id] || 0}</span>
                    <button className="btn tiny primary" onClick={() => addToCart(item.id)}>+</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="section alt">
          <div className="container split">
            <div>
              <p className="eyebrow">About Us</p>
              <h2>Rooted in Gandhi Nagar, focused on healthier daily choices</h2>
              <p>
                Dabholkar Stores serves residents around Gandhi Nagar and nearby areas with a practical blend of quality groceries, organic options, and personalized service.
              </p>
              <p>
                The store is known for maintaining a hygienic environment and helping families choose chemical-free alternatives for everyday cooking and wellness.
              </p>
            </div>

            <img
              className="about-image"
              src="https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=1200&q=80"
              alt="Clean grocery store shelves"
              loading="lazy"
            />
          </div>
        </section>

        <section id="delivery" className="section">
          <div className="container split">
            <div>
              <p className="eyebrow">Delivery Info</p>
              <h2>Existing home delivery service, now easier to access online</h2>
              <p>
                Delivery is available for local customers via direct call and WhatsApp order confirmation.
              </p>
              <ul className="list">
                <li>Service hours: {business.hours}</li>
                <li>Coverage: Gandhi Nagar and nearby local neighborhoods</li>
                <li>Order mode: WhatsApp-first with phone support</li>
                <li>Best for weekly grocery lists and repeat household essentials</li>
              </ul>
            </div>
            <div className="card">
              <h3>Service Highlights</h3>
              {serviceHighlights.map((highlight) => (
                <article key={highlight.title} className="highlight-row">
                  <h4>{highlight.title}</h4>
                  <p>{highlight.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="section alt">
          <div className="container">
            <p className="eyebrow">Testimonials</p>
            <h2>What 100+ Google reviewers appreciate</h2>
            <div className="category-grid">
              {testimonials.map((quote) => (
                <article key={quote} className="card quote">
                  <p>"{quote}"</p>
                </article>
              ))}
            </div>
            <div className="review-cta">
              <a
                className="btn primary"
                href={business.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read Google Reviews
              </a>
            </div>
          </div>
        </section>

        <section id="contact" className="section">
          <div className="container split">
            <div>
              <p className="eyebrow">Contact & Location</p>
              <h2>Visit the store or place your order in minutes</h2>
              <ul className="list">
                <li><strong>Phone:</strong> <a href={`tel:${business.phone}`}>+91 80444 64801</a></li>
                <li><strong>Hours:</strong> {business.hours}</li>
                <li><strong>Address:</strong> {business.address}</li>
              </ul>
            </div>
            <iframe
              title="Dabholkar Stores Location"
              src={business.mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="map-frame"
            />
          </div>
        </section>
      </main>

      <button className="floating-order" onClick={handleCartOrder}>
        Order Now on WhatsApp ({cartCount})
      </button>

      <footer className="site-footer">
        <div className="container footer-wrap">
          <div className="badge-grid">
            <span>{business.ratingGoogle} Rated</span>
            <span>GST Registered</span>
            <span>Organic Specialist</span>
          </div>
          <p>(c) {year} {business.name}. Organic grocery visibility site for Gandhi Nagar, Hyderabad.</p>
        </div>
      </footer>
    </>
  );
}

export default App;
