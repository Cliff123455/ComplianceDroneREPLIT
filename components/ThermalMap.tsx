import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ThermalAnomaly {
  id: string;
  jobId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  coordinates: {
    lat: number;
    lng: number;
  };
  temperature: number;
  description: string;
  image: string;
  detectedAt: string;
}

interface AnomalyType {
  color: string;
  icon: string;
  description: string;
}

interface SeverityLevel {
  color: string;
  priority: number;
  description: string;
}

interface ThermalMapProps {
  anomalies: ThermalAnomaly[];
  center: [number, number];
  zoom: number;
  anomalyTypes: Record<string, AnomalyType>;
  severityLevels: Record<string, SeverityLevel>;
  onAnomalyClick?: (anomaly: ThermalAnomaly) => void;
}

const ThermalMap: React.FC<ThermalMapProps> = ({
  anomalies,
  center,
  zoom,
  anomalyTypes,
  severityLevels,
  onAnomalyClick
}) => {
  // Create custom markers for different anomaly types and severities
  const createCustomIcon = (anomaly: ThermalAnomaly) => {
    const typeConfig = anomalyTypes[anomaly.type];
    const severityConfig = severityLevels[anomaly.severity];
    
    const iconHtml = `
      <div style="
        background-color: ${severityConfig.color};
        border: 3px solid ${typeConfig.color};
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: white;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${typeConfig.icon}
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-thermal-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10],
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTemperature = (temp: number) => {
    return `${temp.toFixed(1)}°C`;
  };

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {anomalies.map((anomaly) => (
          <Marker
            key={anomaly.id}
            position={[anomaly.coordinates.lat, anomaly.coordinates.lng]}
            icon={createCustomIcon(anomaly)}
            eventHandlers={{
              click: () => {
                if (onAnomalyClick) {
                  onAnomalyClick(anomaly);
                }
              },
            }}
          >
            <Popup className="thermal-anomaly-popup">
              <div className="p-2 min-w-64">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-gray-800">
                    {anomalyTypes[anomaly.type].icon} {anomalyTypes[anomaly.type].description}
                  </h3>
                  <span 
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white`}
                    style={{ backgroundColor: severityLevels[anomaly.severity].color }}
                  >
                    {anomaly.severity.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temperature:</span>
                    <span className="font-semibold text-red-600">
                      {formatTemperature(anomaly.temperature)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coordinates:</span>
                    <span className="font-mono text-xs">
                      {anomaly.coordinates.lat.toFixed(6)}, {anomaly.coordinates.lng.toFixed(6)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Job ID:</span>
                    <span className="font-mono text-xs">{anomaly.jobId.slice(-8)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Detected:</span>
                    <span className="text-xs">{formatDate(anomaly.detectedAt)}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-700">{anomaly.description}</p>
                </div>
                
                {anomaly.image && (
                  <div className="mt-3">
                    <img 
                      src={`/images/${anomaly.image}`}
                      alt="Thermal anomaly"
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500">ID: {anomaly.id}</span>
                  <button 
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    onClick={() => {
                      if (onAnomalyClick) {
                        onAnomalyClick(anomaly);
                      }
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Custom styles for the map */}
      <style jsx global>{`
        .custom-thermal-marker {
          background: none !important;
          border: none !important;
        }
        
        .thermal-anomaly-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .thermal-anomaly-popup .leaflet-popup-content {
          margin: 0;
          line-height: 1.4;
        }
        
        .thermal-anomaly-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
};

export default ThermalMap;