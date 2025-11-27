import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Instituicao, Entidade, Supplier, Equipment, Assignment } from '../types';
import * as L from 'leaflet';
import { FaMapMarkedAlt, FaFilter, FaSpinner, FaSync } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css'; // Import leaflet CSS

interface MapDashboardProps {
    instituicoes: Instituicao[];
    entidades: Entidade[];
    suppliers: Supplier[];
    equipment?: Equipment[];
    assignments?: Assignment[];
}

interface MapItem {
    id: string;
    type: 'Instituição' | 'Entidade' | 'Fornecedor';
    name: string;
    address: string;
    city: string;
    postal_code: string;
    coordinates?: { lat: number; lng: number };
    equipmentCount?: number; // New field
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

const MapDashboard: React.FC<MapDashboardProps> = ({ instituicoes, entidades, suppliers, equipment = [], assignments = [] }) => {
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
        
        // Pre-calculate counts
        const activeAssignments = assignments.filter(a => !a.returnDate);
        const entityEquipmentCount: Record<string, number> = {};
        
        activeAssignments.forEach(a => {
            if (a.entidadeId) {
                entityEquipmentCount[a.entidadeId] = (entityEquipmentCount[a.entidadeId] || 0) + 1;
            }
        });

        // For Institutions, sum up all child entities
        const institutionEquipmentCount: Record<string, number> = {};
        entidades.forEach(e => {
            const count = entityEquipmentCount[e.id] || 0;
            institutionEquipmentCount[e.instituicaoId] = (institutionEquipmentCount[e.instituicaoId] || 0) + count;
        });
        
        if (filters.showInstitutions) {
            instituicoes.forEach(i => {
                const addr = [i.address_line || i.address, i.postal_code, i.city].filter(Boolean).join(', ');
                if (addr) items.push({ 
                    id: i.id, 
                    type: 'Instituição', 
                    name: i.name, 
                    address: i.address_line || i.address || '', 
                    city: i.city || '', 
                    postal_code: i.postal_code || '',
                    equipmentCount: institutionEquipmentCount[i.id] || 0
                });
            });
        }
        if (filters.showEntities) {
            entidades.forEach(e => {
                const addr = [e.address_line || e.address, e.postal_code, e.city].filter(Boolean).join(', ');
                if (addr) items.push({ 
                    id: e.id, 
                    type: 'Entidade', 
                    name: e.name, 
                    address: e.address_line || e.address || '', 
                    city: e.city || '', 
                    postal_code: e.postal_code || '',
                    equipmentCount: entityEquipmentCount[e.id] || 0
                });
            });
        }
        if (filters.showSuppliers) {
            suppliers.forEach(s => {
                const addr = [s.address_line || s.address, s.postal_code, s.city].filter(Boolean).join(', ');
                if (addr) items.push({ id: s.id, type: 'Fornecedor', name: s.name, address: s.address_line || s.address || '', city: s.city || '', postal_code: s.postal_code || '' });
            });
        }
        return items;
    }, [instituicoes, entidades, suppliers, filters, assignments]);

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
            
            // Fix: Corrected the attribution string.
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            mapInstanceRef.current = map;
            markersLayerRef.current = L.layerGroup().addTo(map);
        }
    }, []);

    // 4. Update markers when data changes
    useEffect(() => {
        if (!mapInstanceRef.current || !markersLayerRef.current) return;

        markersLayerRef.current.clearLayers();

        const markers: any[] = [];
        processedItems.forEach(item => {
            if (item.coordinates) {
                const marker = L.marker([item.coordinates.lat, item.coordinates.lng], { icon: icons[item.type] });
                let popupContent = `<b>${item.name}</b><br/>${item.type}<br/>${item.address}, ${item.postal_code} ${item.city}`;
                if (item.equipmentCount !== undefined) {
                    popupContent += `<br/>Equipamentos: ${item.equipmentCount}`;
                }
                marker.bindPopup(popupContent);
                markers.push(marker);
            }
        });
        
        markers.forEach(m => markersLayerRef.current.addLayer(m));
        
        // Auto-zoom
        if (markers.length > 0) {
            const group = new L.FeatureGroup(markers);
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.5));
        }

    }, [processedItems]);

    // Cleanup
    useEffect(() => {
        const map = mapInstanceRef.current;
        return () => {
            if (map) {
                map.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);
    
    // Fix: Added return statement with JSX to render the component UI.
    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FaMapMarkedAlt className="text-brand-secondary" /> Mapeamento Geográfico de Ativos
                </h2>
                <div className="flex items-center gap-4 bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={filters.showInstitutions} onChange={e => setFilters(f => ({ ...f, showInstitutions: e.target.checked }))} className="rounded text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-600" />
                        Instituições
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={filters.showEntities} onChange={e => setFilters(f => ({ ...f, showEntities: e.target.checked }))} className="rounded text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-600" />
                        Entidades
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={filters.showSuppliers} onChange={e => setFilters(f => ({ ...f, showSuppliers: e.target.checked }))} className="rounded text-orange-500 bg-gray-700 border-gray-600 focus:ring-orange-600" />
                        Fornecedores
                    </label>
                </div>
            </div>

            <div className="flex-grow rounded-lg overflow-hidden relative" ref={mapContainerRef} style={{ height: '100%', width: '100%' }}>
                {isLoading && (
                    <div className="absolute inset-0 bg-black/70 z-[1000] flex flex-col items-center justify-center text-white">
                        <FaSpinner className="animate-spin text-3xl mb-4" />
                        <p className="font-semibold">A processar localizações...</p>
                        <p className="text-sm text-gray-400">{progress.current} de {progress.total} itens processados.</p>
                        <progress value={progress.current} max={progress.total} className="w-64 mt-2 h-2 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-gray-700 [&::-webkit-progress-value]:bg-brand-secondary"></progress>
                    </div>
                )}
            </div>
        </div>
    );
};

// Fix: Added default export.
export default MapDashboard;
