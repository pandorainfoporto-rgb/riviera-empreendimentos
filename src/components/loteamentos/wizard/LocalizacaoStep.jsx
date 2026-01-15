import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { ChevronRight, ChevronLeft, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix para o ícone padrão do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function LocalizacaoStep({ data, onNext, onBack, onCancel }) {
  const [position, setPosition] = useState(
    data.latitude && data.longitude
      ? { lat: data.latitude, lng: data.longitude }
      : { lat: -23.5505, lng: -46.6333 } // São Paulo como padrão
  );
  const [searchAddress, setSearchAddress] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (data.latitude && data.longitude) {
      setPosition({ lat: data.latitude, lng: data.longitude });
    }
  }, [data]);

  const handleSearch = async () => {
    if (!searchAddress.trim()) return;

    setSearching(true);
    try {
      // Usar Nominatim para geocodificação (gratuito)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&countrycodes=br&limit=1`
      );
      const results = await response.json();

      if (results && results.length > 0) {
        const { lat, lon } = results[0];
        setPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        alert("Endereço não encontrado. Tente novamente.");
      }
    } catch (error) {
      alert("Erro ao buscar endereço: " + error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleNext = () => {
    onNext({
      ...data,
      latitude: position.lat,
      longitude: position.lng,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900">Marque a Localização no Mapa</h4>
            <p className="text-sm text-blue-700 mt-1">
              Clique no mapa para marcar a localização exata do loteamento ou busque pelo endereço.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <Label>Buscar Endereço</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Digite o endereço completo..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden" style={{ height: "400px" }}>
          <MapContainer
            center={position}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            key={`${position.lat}-${position.lng}`}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>

        <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <Label className="text-xs text-gray-600">Latitude</Label>
            <Input value={position.lat.toFixed(6)} readOnly className="bg-white" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Longitude</Label>
            <Input value={position.lng.toFixed(6)} readOnly className="bg-white" />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
        >
          Próximo: Upload DWG
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}