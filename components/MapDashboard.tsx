import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Instituicao, Entidade, Supplier, Equipment, Assignment } from '../types';
import * as L from 'leaflet';
import { FaMapMarkedAlt, FaSpinner } from 'react-icons/fa';
import { XIcon } from './common/Icons';
import 'leaflet/dist/leaflet.css';

interface MapDashboardProps {
    instituicoes: Instituicao[];
    entidades: Entidade[];
    suppliers: Supplier[];
    equipment?: Equipment[];
    assignments?: Assignment[];
    onClose?: () => void;
}

interface MapItem {
    id: string;
    type: 'Instituição' | 'Entidade' | 'Fornecedor';
    name: string;
    address: string;
    city: string;
    postal_code: string;
    coordinates?: { lat: number; lng: number };
    equipmentCount?: number;
}

const createIcon = (color: string) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const icons = { 'Instituição': createIcon('violet'), 'Entidade': createIcon('blue'), 'Fornecedor': createIcon('orange') };
const geoCache: Record<string, { lat: number; lng: number } | null> = {};

const MapDashboard: React.FC<MapDashboardProps> = ({ instituicoes, entidades, suppliers, equipment = [], assignments = [], onClose }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const [processedItems, setProcessedItems] = useState<MapItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const allItems = useMemo(() => {
        const items: MapItem[] = [];
        const activeAssignments = assignments.filter(a => !a.return_date);
        const entityEquipmentCount: Record<string, number> = {};
        activeAssignments.forEach(a => { if (a.entidade_id) entityEquipmentCount[a.entidade_id] = (entityEquipmentCount[a.entidade_id] || 0) + 1; });

        instituicoes.forEach(i => {
            if (i.address_line) items.push({ id: i.id, type: 'Instituição', name: i.name, address: i.address_line, city: i.city || '', postal_code: i.postal_code || '' });
        });
        entidades.forEach(e => {
            if (e.address_line) items.push({ id: e.id, type: 'Entidade', name: e.name, address: e.address_line, city: e.city || '', postal_code: e.postal_code || '', equipmentCount: entityEquipmentCount[e.id] || 0 });
        });
        suppliers.forEach(s => {
            if (s.address_line) items.push({ id: s.id, type: 'Fornecedor', name: s.name, address: s.address_line, city: s.city || '', postal_code: s.postal_code || '' });
        });
        return items;
    }, [instituicoes, entidades, suppliers, assignments]);

    useEffect(() => {
        let isMounted = true;
        const processGeocoding = async () => {
            setIsLoading(true);
            const results: MapItem[] = [];
            for (const item of allItems) {
                if (!isMounted) break;
                const query = `${item.address}, ${item.postal_code} ${item.city}, Portugal`;
                if (geoCache[query]) { results.push({ ...item, coordinates: geoCache[query]! }); }
                else {
                    try {
                        await new Promise(r => setTimeout(r, 1000));
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                        const data = await res.json();
                        if (data && data.length > 0) {
                            const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                            geoCache[query] = coords;
                            results.push({ ...item, coordinates: coords });
                        }
                    } catch (e) { console.error(e); }
                }
            }
            if (isMounted) { setProcessedItems(results); setIsLoading(false); }
        };
        processGeocoding();
        return () => { isMounted = false; };
    }, [allItems]);

    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current).setView([39.5, -8.0], 6);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            mapInstanceRef.current = map;
            markersLayerRef.current = L.layerGroup().addTo(map);
        }
    }, []);

    useEffect(() => {
        if (mapInstanceRef.current && markersLayerRef.current) {
            markersLayerRef.current.clearLayers();
            processedItems.forEach(item => {
                if (item.coordinates) {
                    const m = L.marker([item.coordinates.lat, item.coordinates.lng], { icon: icons[item.type] });
                    m.bindPopup(`<b>${item.name}</b><br/>${item.type}`);
                    markersLayerRef.current!.addLayer(m);
                }
            });
        }
    }, [processedItems]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl h-[80vh] flex flex-col relative">
            {isLoading && <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center text-white"><FaSpinner className="animate-spin mr-2"/> A carregar mapa...</div>}
            <div className="flex justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaMapMarkedAlt /> Mapa de Ativos</h2>
                {onClose && <button onClick={onClose}><XIcon /></button>}
            </div>
            <div className="flex-grow rounded-lg overflow-hidden" ref={mapContainerRef}></div>
        </div>
    );
};

export default MapDashboard;