import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X, Check, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon matching MapTab
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM1NjlBYjgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjEgMTBjMCA3LTkgMTMtOSAxM3MtOS02LTktMTNhOSA5IDAgMCAxIDE4IDB6Ij48L3BhdGg+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyI+PC9jaXJjbGU+PC9zdmc+',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

export default function LocationPickerModal({ isOpen, onClose, onSelect, initialLocation, initialCoordinates }) {
  const [position, setPosition] = useState(
    initialCoordinates?.lat && initialCoordinates?.lng
      ? { lat: initialCoordinates.lat, lng: initialCoordinates.lng }
      : null
  );
  const [address, setAddress] = useState(initialLocation || '');
  const [isFetching, setIsFetching] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setPosition(
        initialCoordinates?.lat && initialCoordinates?.lng
          ? { lat: initialCoordinates.lat, lng: initialCoordinates.lng }
          : null
      );
      setAddress(initialLocation || '');
    }
  }, [isOpen, initialCoordinates, initialLocation]);

  const handleMapClick = async (latlng) => {
    setPosition(latlng);
    setIsFetching(true);
    try {
      // Reverse geocoding using Nominatim
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        // Simplify address
        const parts = data.display_name.split(', ');
        const simplified = parts.length > 3 ? `${parts[0]}, ${parts[parts.length - 3]}` : data.display_name;
        setAddress(simplified);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    setIsFetching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setPosition({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        toast.success('Location found!');
      } else {
        toast.error('Location not found. Try dropping a pin.');
      }
    } catch (err) {
      toast.error('Search failed.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleConfirm = () => {
    if (!position && !address.trim()) {
      toast.error('Please select a location on the map or type an address');
      return;
    }
    onSelect({
      location: address,
      coordinates: position || { lat: null, lng: null }
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-ethereal-surface border border-ethereal-outline rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh] max-h-[800px] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-ethereal-outline/50 bg-ethereal-surface-dim/50">
            <h3 className="text-xl font-heading text-ethereal-tertiary flex items-center gap-2">
              <MapPin size={20} className="text-ethereal-primary" />
              Select Location
            </h3>
            <button onClick={onClose} className="p-2 text-ethereal-tertiary/60 hover:text-ethereal-tertiary hover:bg-ethereal-surface rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Map Area */}
          <div className="flex-1 relative bg-ethereal-surface-dim/20 z-0">
            <MapContainer
              center={position ? [position.lat, position.lng] : [20, 0]}
              zoom={position ? 14 : 2}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleMapClick} />
              {position && (
                <Marker position={[position.lat, position.lng]} icon={customIcon} />
              )}
            </MapContainer>
            
            {/* Overlay hint */}
            {!position && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-ethereal-surface/90 backdrop-blur px-6 py-2 rounded-full border border-ethereal-primary/30 shadow-lg pointer-events-none">
                <span className="text-sm font-medium text-ethereal-tertiary">Tap anywhere to drop a pin</span>
              </div>
            )}
          </div>

          {/* Controls Footer */}
          <div className="p-6 bg-ethereal-surface border-t border-ethereal-outline/50 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-ethereal-tertiary/60 uppercase tracking-wider mb-2">
                Location Name / Address
              </label>
              <form onSubmit={handleSearch} className="relative flex items-center">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Search address or tap map..."
                  className="w-full bg-ethereal-surface-dim border border-ethereal-outline rounded-xl px-4 py-3 text-ethereal-tertiary placeholder:text-ethereal-tertiary/30 focus:outline-none focus:border-ethereal-primary focus:ring-1 focus:ring-ethereal-primary transition-all pr-24"
                />
                <div className="absolute right-2 flex items-center gap-2">
                  {isFetching && (
                    <div className="w-4 h-4 border-2 border-ethereal-primary/30 border-t-ethereal-primary rounded-full animate-spin"></div>
                  )}
                  <button 
                    type="submit" 
                    className="p-1.5 bg-ethereal-primary/10 text-ethereal-primary hover:bg-ethereal-primary hover:text-white rounded-lg transition-colors"
                  >
                    <Search size={16} />
                  </button>
                </div>
              </form>
            </div>
            
            <button
              onClick={handleConfirm}
              className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 py-3 px-8 shadow-lg hover:shadow-xl hover:-translate-y-1 whitespace-nowrap"
            >
              <Check size={18} />
              Confirm Location
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
