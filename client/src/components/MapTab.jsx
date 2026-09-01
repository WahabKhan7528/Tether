import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { MapPin, Compass } from 'lucide-react';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Ethereal Icon
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM1NjlBYjgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjEgMTBjMCA3LTkgMTMtOSAxM3MtOS02LTktMTNhOSA5IDAgMCAxIDE4IDB6Ij48L3BhdGg+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyI+PC9jaXJjbGU+PC9zdmc+',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function MapTab() {
  const [memoriesWithLocation, setMemoriesWithLocation] = useState([]);

  // Fetch all memories
  const { data: memories } = useQuery({
    queryKey: ['memories-map'],
    queryFn: async () => {
      const res = await api.get('/memories?limit=100'); 
      return res.data.success ? res.data.data : [];
    }
  });

  // Fetch gallery (for gallery-only photos)
  const { data: gallery, isLoading } = useQuery({
    queryKey: ['gallery-map'],
    queryFn: async () => {
      const res = await api.get('/gallery?limit=100'); 
      return res.data.success ? res.data.data : [];
    }
  });

  useEffect(() => {
    let combined = [];
    if (memories) {
      combined = [...memories.filter(m => m.coordinates && m.coordinates.lat !== null && m.coordinates.lng !== null)];
    }
    if (gallery) {
      // Only take items that were directly uploaded to gallery (not memory images to avoid duplicates)
      const galleryLocs = gallery.filter(g => g.source === 'gallery' && g.coordinates && g.coordinates.lat !== null && g.coordinates.lng !== null);
      
      // Map to a similar structure for rendering
      const galleryMapped = galleryLocs.map(g => ({
        _id: g._id,
        title: g.title || 'Gallery Photo',
        location: g.location,
        coordinates: g.coordinates,
        images: [{ url: g.url }],
        isGallery: true
      }));
      combined = [...combined, ...galleryMapped];
    }
    setMemoriesWithLocation(combined);
  }, [memories, gallery]);

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center">Loading map...</div>;
  }

  // Center of the world or default center if no memories
  const defaultCenter = memoriesWithLocation.length > 0 
    ? [memoriesWithLocation[0].coordinates.lat, memoriesWithLocation[0].coordinates.lng] 
    : [20, 0];
  const defaultZoom = memoriesWithLocation.length > 0 ? 5 : 2;

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center py-4">
      {/* Premium Heading */}
      <div className="relative mb-12 flex flex-col items-center mt-2 w-full max-w-2xl text-center mx-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md h-32 bg-ethereal-primary/10 blur-[50px] rounded-full pointer-events-none z-0"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-3">
             <div className="w-8 md:w-16 h-[1px] bg-gradient-to-r from-transparent to-ethereal-primary/60"></div>
             <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-ethereal-primary font-bold">Journey</span>
             <div className="w-8 md:w-16 h-[1px] bg-gradient-to-l from-transparent to-ethereal-primary/60"></div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-heading text-ethereal-tertiary mb-6 drop-shadow-sm leading-tight">
            Our Places
          </h2>
          
          <div className="inline-flex items-center gap-2 bg-ethereal-surface-dim/80 backdrop-blur-md border border-ethereal-primary/30 px-6 py-2.5 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.05)]">
            <Compass size={14} className="text-ethereal-primary" />
            <p className="text-sm text-ethereal-tertiary/80 font-medium tracking-wide">
              A map of all the places we've been together.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl h-[600px] rounded-[2rem] overflow-hidden shadow-ambient border border-ethereal-outline/50 relative z-10 group/map">
        <MapContainer center={defaultCenter} zoom={defaultZoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {memoriesWithLocation.map((memory) => (
            <Marker 
              key={memory._id} 
              position={[memory.coordinates.lat, memory.coordinates.lng]}
              icon={customIcon}
            >
              <Popup className="ethereal-popup">
                <div className="flex flex-col gap-2 min-w-[150px]">
                  {memory.images && memory.images.length > 0 && (
                     <div className="w-full h-24 rounded-lg overflow-hidden bg-ethereal-surface">
                       <img src={memory.images[0].url} alt={memory.title} className="w-full h-full object-cover" />
                     </div>
                  )}
                  <h3 className="font-heading text-lg text-ethereal-tertiary m-0 leading-tight">{memory.title}</h3>
                  <p className="text-xs text-ethereal-tertiary/60 m-0">{memory.location}</p>
                  {memory.isGallery ? (
                    <Link to="/gallery" className="text-xs text-ethereal-primary font-semibold hover:underline mt-1 block">View in Gallery</Link>
                  ) : (
                    <Link to={`/memories/${memory._id}`} className="text-xs text-ethereal-primary font-semibold hover:underline mt-1 block">View Memory</Link>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {memoriesWithLocation.length === 0 && (
          <div className="absolute inset-0 z-[1000] bg-ethereal-surface-dim/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 pointer-events-none">
            <Compass size={48} className="text-ethereal-primary mb-4 opacity-50" />
            <h3 className="text-2xl font-heading text-ethereal-tertiary mb-2">No locations yet</h3>
            <p className="text-ethereal-tertiary/60 max-w-sm">When you add a memory with location coordinates, it will appear here on your shared map.</p>
          </div>
        )}
      </div>
    </div>
  );
}
