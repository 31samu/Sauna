import { useEffect, useState } from 'react';
import './HiddenTexts.css';

// Sample snippets that appear behind the mist. Feel free to customize or extend.
const snippets = [
  'by Rasmus Arvidsson',
  'St. Sigfrids Folkhägskola',
  '18:15',
  'Triennalen',
  'Relax',
  'Worry',
  'Småland',
  'Växjö',
  '2026',
  'Lake',
  'Performance',
  'Sauna',
];

export default function HiddenTexts() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const generate = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
        const inset = 30; // distance from edges
        const safeWidth = Math.max(0, width - inset * 2);
        const safeHeight = Math.max(0, height - inset * 2);
        const newItems = snippets.map((text) => ({
          text,
          x: inset + Math.random() * safeWidth,
          y: inset + Math.random() * safeHeight,
        }));
      setItems(newItems);
    };

    generate();
    window.addEventListener('resize', generate);
    return () => window.removeEventListener('resize', generate);
  }, []);

  return (
    <div className="hidden-texts">
      {items.map((item, i) => (
        <div
          key={i}
          className="hidden-text"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}
