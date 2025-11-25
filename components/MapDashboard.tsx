
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Instituicao, Entidade, Supplier } from '../types';
// @ts-ignore
import L from 'leaflet';
import { FaMapMarkedAlt, FaFilter, FaSpinner, FaSync } from 'react-icons/fa';

interface MapDashboardProps {
    instituicoes: Instituicao[];
    entidades: Entidade[];
    suppliers: Supplier[];
}

interface MapItem {
    id: string;
    type: 'Instituição' | 'Entidade' | 'Fornecedor';
    name: string;
    address: string;
    city: string;
    postal_code: string;
    coordinates?: { lat: number; lng: number };
}

// Custom Icons
const createIcon = (color: string) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const icons = {
    'Instituição': createIcon('violet'),
    'Entidade': createIcon('blue'),
    'Fornecedor': createIcon('orange')
};

// Cache for geocoding to avoid API abuse
const geoCache: Record<string, { lat: number; lng: number } | null> = {};

const MapDashboard: React.FC<MapDashboardProps> = ({ instituicoes, entidades, suppliers }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersLayerRef = useRef<any>(null);
    
    const [filters, setFilters] = useState({
        showInstitutions: true,
        showEntities: true,
        showSuppliers: true
    });
    const [processedItems, setProcessedItems] = useState<MapItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState({ total: 0, current: 0 });

    // 1. Prepare Data
    const allItems = useMemo(() => {
        const items: MapItem[] = [];
        
        if (filters.showInstitutions) {
            instituicoes.forEach(i => {
                const addr = [i.address_line || i.address, i.postal_code, i.city].filter(Boolean).join(', ');
                if (addr) items.push({ id: i.id, type: 'Instituição', name: i.name, address: i.address_line || i.address || '', city: i.city || '', postal_code: i.postal_code || '' });
            });
        }
        if (filters.showEntities) {
            entidades.forEach(e => {
                const addr = [e.address_line || e.address, e.postal_code, e.city].filter(Boolean).join(', ');
                if (addr) items.push({ id: e.id, type: 'Entidade', name: e.name, address: e.address_line || e.address || '', city: e.city || '', postal_code: e.postal_code || '' });
            });
        }
        if (filters.showSuppliers) {
            suppliers.forEach(s => {
                const addr = [s.address_line || s.address, s.postal_code, s.city].filter(Boolean).join(', ');
                if (addr) items.push({ id: s.id, type: 'Fornecedor', name: s.name, address: s.address_line || s.address || '', city: s.city || '', postal_code: s.postal_code || '' });
            });
        }
        return items;
    }, [instituicoes, entidades, suppliers, filters]);

    // 2. Geocoding Logic (Batch processing with delay)
    useEffect(() => {
        let isMounted = true;
        const processGeocoding = async () => {
            setIsLoading(true);
            const results: MapItem[] = [];
            setProgress({ total: allItems.length, current: 0 });

            for (let i = 0; i < allItems.length; i++) {
                if (!isMounted) break;
                const item = allItems[i];
                const query = `${item.address}, ${item.postal_code} ${item.city}, Portugal`; // Assuming Portugal based on context
                
                if (geoCache[query]) {
                    if (geoCache[query]) results.push({ ...item, coordinates: geoCache[query]! });
                } else {
                    try {
                        // Delay to respect Nominatim usage policy (1 req/sec max usually)
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                        const data = await response.json();
                        
                        if (data && data.length > 0) {
                            const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                            geoCache[query] = coords;
                            results.push({ ...item, coordinates: coords });
                        } else {
                            geoCache[query] = null; // Cache miss to avoid retry
                        }
                    } catch (e) {
                        console.error("Geocode error", e);
                    }
                }
                setProgress(prev => ({ ...prev, current: i + 1 }));
            }
            if (isMounted) {
                setProcessedItems(results);
                setIsLoading(false);
            }
        };

        processGeocoding();
        return () => { isMounted = false; };
    }, [allItems]);

    // 3. Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current).setView([39.5, -8.0], 6); // Default Portugal Center
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            markersLayerRef.current = L.layerGroup().addTo(map);
            mapInstanceRef.current = map;
        }
    }, []);

    // 4. Update Markers
    useEffect(() => {
        if (!mapInstanceRef.current || !markersLayerRef.current) return;

        markersLayerRef.current.clearLayers();
        const bounds = L.latLngBounds([]);

        processedItems.forEach(item => {
            if (item.coordinates) {
                const marker = L.marker([item.coordinates.lat, item.coordinates.lng], { icon: icons[item.type] })
                    .bindPopup(`
                        <div class="text-sm text-gray-800">
                            <strong class="block text-base border-b pb-1 mb-1">${item.name}</strong>
                            <span class="text-xs uppercase font-bold text-gray-500">${item.type}</span><br/>
                            ${item.address}<br/>
                            ${item.postal_code} ${item.city}
                        </div>
                    `);
                markersLayerRef.current?.addLayer(marker);
                bounds.extend([item.coordinates.lat, item.coordinates.lng]);
            }
        });

        if (processedItems.length > 0 && mapInstanceRef.current) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [processedItems]);

    return (
        <div className="bg-surface-dark rounded-lg shadow-xl h-[calc(100vh-100px)] flex flex-col relative overflow-hidden border border-gray-700">
            {/* Floating Controls */}
            <div className="absolute top-4 right-4 z-[400] bg-gray-900/90 backdrop-blur p-4 rounded-lg shadow-2xl border border-gray-600 w-64">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <FaMapMarkedAlt className="text-brand-secondary"/> Pesquisa no Mapa
                </h3>
                <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300 hover:text-white">
                        <input type="checkbox" checked={filters.showInstitutions} onChange={e => setFilters({...filters, showInstitutions: e.target.checked})} className="rounded bg-gray-700 border-gray-500 text-purple-500 focus:ring-purple-500"/>
                        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-violet-500 inline-block"></span> Instituições</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300 hover:text-white">
                        <input type="checkbox" checked={filters.showEntities} onChange={e => setFilters({...filters, showEntities: e.target.checked})} className="rounded bg-gray-700 border-gray-500 text-blue-500 focus:ring-blue-500"/>
                        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Entidades</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-300 hover:text-white">
                        <input type="checkbox" checked={filters.showSuppliers} onChange={e => setFilters({...filters, showSuppliers: e.target.checked})} className="rounded bg-gray-700 border-gray-500 text-orange-500 focus:ring-orange-500"/>
                        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> Fornecedores</span>
                    </label>
                </div>
                
                {isLoading && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-xs text-yellow-400 flex items-center gap-2 mb-1">
                            <FaSpinner className="animate-spin"/> A localizar moradas...
                        </p>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }}></div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 text-right">{progress.current}/{progress.total}</p>
                    </div>
                )}
            </div>

            <div ref={mapContainerRef} className="flex-grow w-full h-full z-0" />
        </div>
    );
};

export default MapDashboard;
