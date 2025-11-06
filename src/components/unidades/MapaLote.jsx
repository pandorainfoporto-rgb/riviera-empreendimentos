import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Target } from "lucide-react";

// Fix for default marker icon in React-Leaflet
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function MapaLote({ coordenadas, onSelecionarCoordenadas, altura = "400px" }) {
  const [markerPosition, setMarkerPosition] = useState(
    coordenadas || { lat: -25.4284, lng: -49.2733 } // Curitiba como padrão
  );
  const [mapCenter, setMapCenter] = useState(markerPosition);

  const handleMapClick = (latlng) => {
    setMarkerPosition(latlng);
  };

  const handleConfirmar = () => {
    if (onSelecionarCoordenadas) {
      onSelecionarCoordenadas(markerPosition);
    }
  };

  const handleCentralizarAtual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMarkerPosition(newPos);
          setMapCenter(newPos);
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          alert("Não foi possível obter sua localização atual");
        }
      );
    } else {
      alert("Geolocalização não suportada pelo navegador");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <MapPin className="w-4 h-4 inline mr-1" />
          Clique no mapa para selecionar a localização
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCentralizarAtual}
        >
          <Target className="w-3 h-3 mr-1" />
          Minha Localização
        </Button>
      </div>

      <div style={{ height: altura, borderRadius: "8px", overflow: "hidden" }}>
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <Marker position={[markerPosition.lat, markerPosition.lng]}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Localização Selecionada</p>
                <p className="text-xs text-gray-600">
                  Lat: {markerPosition.lat.toFixed(6)}
                  <br />
                  Lng: {markerPosition.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <Card className="p-3 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <p className="font-semibold text-blue-900">Coordenadas Selecionadas:</p>
            <p className="text-blue-700">
              Latitude: {markerPosition.lat.toFixed(6)} | Longitude: {markerPosition.lng.toFixed(6)}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmar}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Importar Coordenadas
          </Button>
        </div>
      </Card>
    </div>
  );
}