import { useState } from "react";
import "./RevolvingCarousel3D.css";

const DEFAULT_CAROUSEL_ITEMS = [
  {
    id: "rc_nature",
    title: "Emerald Alpine Reflections",
    category: "Nature",
    badge: "🌿 Nature",
    location: "Banff National Park, Canada",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "rc_travel",
    title: "Sunlit Mediterranean Haven",
    category: "Travel",
    badge: "✈️ Travel",
    location: "Santorini, Greece",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "rc_moments",
    title: "Golden Hour Whispers",
    category: "Moments",
    badge: "✨ Moments",
    location: "Big Sur, California",
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "rc_architecture",
    title: "Tokyo Cyberpunk Rain",
    category: "Architecture",
    badge: "🏛️ Architecture",
    location: "Shinjuku, Tokyo",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "rc_food",
    title: "Artisan Morning Espresso",
    category: "Food & Drinks",
    badge: "☕ Food",
    location: "Florence, Italy",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "rc_animals",
    title: "Arctic Wonder",
    category: "Animals",
    badge: "🦊 Animals",
    location: "Reykjavik, Iceland",
    image: "https://images.unsplash.com/photo-1474511326265-ba4c95be3620?auto=format&fit=crop&w=800&q=80",
  },
];

function RevolvingCarousel3D({ onSelectCard, items = DEFAULT_CAROUSEL_ITEMS }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  const displayItems = (items && items.length >= 6 ? items.slice(0, 6) : DEFAULT_CAROUSEL_ITEMS);

  return (
    <div className="rc3d-stage" aria-label="3D Revolving Photography Showcase">
      <div className="rc3d-floor-glow" />

      {/* 3D revolving cylinder */}
      <div className="rc3d-cylinder">
        {displayItems.map((item, index) => {
          return (
            <div
              key={item.id || index}
              className={`rc3d-card rc3d-card-${index}`}
              onClick={() => onSelectCard && onSelectCard(item)}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Window Header Bar */}
              <div className="rc3d-card-header">
                <div className="rc3d-dots">
                  <span className="rc3d-dot rc3d-dot-red" />
                  <span className="rc3d-dot rc3d-dot-yellow" />
                  <span className="rc3d-dot rc3d-dot-green" />
                </div>
                <span className="rc3d-badge">{item.badge || item.category}</span>
              </div>

              {/* Photo Image */}
              <div className="rc3d-card-media">
                <img
                  src={item.image || item.imageUrl}
                  alt={item.title}
                  className="rc3d-img"
                  loading="eager"
                />
                <div className="rc3d-img-overlay" />
              </div>

              {/* Card Footer Info */}
              <div className="rc3d-card-footer">
                <h4 className="rc3d-title">{item.title}</h4>
                <p className="rc3d-loc">{item.location || item.category}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rc3d-hint">
        <span>🔄 3D Showcase · Hover to Pause</span>
      </div>
    </div>
  );
}

export default RevolvingCarousel3D;
