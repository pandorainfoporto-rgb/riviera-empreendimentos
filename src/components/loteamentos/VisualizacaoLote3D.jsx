import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZoomIn, ZoomOut, RotateCw, Home, Eye, EyeOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function VisualizacaoLote3D({ lote, loteamentos }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const [selectedLoteamento, setSelectedLoteamento] = useState(lote?.loteamento_id || "");
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const { data: todosLotes = [] } = useQuery({
    queryKey: ['lotes_3d', selectedLoteamento],
    queryFn: () => base44.entities.Lote.filter({ loteamento_id: selectedLoteamento }),
    enabled: !!selectedLoteamento,
  });

  const STATUS_COLORS = {
    disponivel: 0x22c55e,
    reservado: 0xfbbf24,
    em_negociacao: 0x3b82f6,
    vendido: 0x6b7280,
    indisponivel: 0xef4444,
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Setup da cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(0, 500, 500);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controlsRef.current = controls;

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 500, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    scene.add(directionalLight);

    // Grid
    const gridHelper = new THREE.GridHelper(2000, 40, 0x888888, 0xcccccc);
    gridHelper.name = "grid";
    scene.add(gridHelper);

    // Plano base
    const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
    const planeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8fbc8f, 
      side: THREE.DoubleSide 
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || todosLotes.length === 0) return;

    // Remove lotes anteriores
    const lotesToRemove = sceneRef.current.children.filter(
      child => child.userData.isLote
    );
    lotesToRemove.forEach(lote => sceneRef.current.remove(lote));

    // Adicionar novos lotes
    todosLotes.forEach((loteData) => {
      if (!loteData.coordenadas_mapa || loteData.coordenadas_mapa.length < 3) return;

      // Converter coordenadas 2D para 3D
      const shape = new THREE.Shape();
      const coords = loteData.coordenadas_mapa.map(coord => 
        new THREE.Vector2(coord[0] / 2, coord[1] / 2)
      );
      
      shape.moveTo(coords[0].x, coords[0].y);
      coords.slice(1).forEach(coord => {
        shape.lineTo(coord.x, coord.y);
      });

      // Geometria extrudada para dar volume ao lote
      const extrudeSettings = {
        depth: loteData.id === lote?.id ? 20 : 10,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 1,
        bevelSegments: 1
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      
      const color = STATUS_COLORS[loteData.status] || STATUS_COLORS.disponivel;
      const material = new THREE.MeshStandardMaterial({ 
        color: color,
        transparent: true,
        opacity: loteData.id === lote?.id ? 1 : 0.7,
        emissive: loteData.id === lote?.id ? color : 0x000000,
        emissiveIntensity: loteData.id === lote?.id ? 0.3 : 0
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { 
        isLote: true, 
        loteId: loteData.id,
        numero: loteData.numero,
        status: loteData.status
      };

      sceneRef.current.add(mesh);

      // Adicionar label (texto 3D)
      if (showLabels) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = 'Bold 48px Arial';
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.fillText(loteData.numero, canvas.width / 2, canvas.height / 2 + 15);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        // Posicionar label acima do lote
        const centerX = coords.reduce((sum, c) => sum + c.x, 0) / coords.length;
        const centerY = coords.reduce((sum, c) => sum + c.y, 0) / coords.length;
        sprite.position.set(centerX, 30, -centerY);
        sprite.scale.set(50, 25, 1);
        sprite.userData = { isLabel: true };

        sceneRef.current.add(sprite);
      }
    });

    // Ajustar câmera para enquadrar os lotes
    if (todosLotes.length > 0 && cameraRef.current) {
      const box = new THREE.Box3();
      sceneRef.current.children
        .filter(child => child.userData.isLote)
        .forEach(child => box.expandByObject(child));
      
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5;

      cameraRef.current.position.set(center.x, cameraZ, center.z + cameraZ);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  }, [todosLotes, lote, showLabels]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const grid = sceneRef.current.getObjectByName("grid");
    if (grid) grid.visible = showGrid;
  }, [showGrid]);

  const handleZoomIn = () => {
    if (cameraRef.current && controlsRef.current) {
      const direction = new THREE.Vector3();
      cameraRef.current.getWorldDirection(direction);
      cameraRef.current.position.addScaledVector(direction, 50);
    }
  };

  const handleZoomOut = () => {
    if (cameraRef.current && controlsRef.current) {
      const direction = new THREE.Vector3();
      cameraRef.current.getWorldDirection(direction);
      cameraRef.current.position.addScaledVector(direction, -50);
    }
  };

  const handleReset = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 500, 500);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Select value={selectedLoteamento} onValueChange={setSelectedLoteamento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um loteamento" />
              </SelectTrigger>
              <SelectContent>
                {loteamentos.map(lot => (
                  <SelectItem key={lot.id} value={lot.id}>{lot.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {lote && (
            <Badge className="bg-blue-600 text-white">
              Visualizando: Lote {lote.numero}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <Home className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowGrid(!showGrid)}
          >
            {showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowLabels(!showLabels)}
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg border">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded border" 
              style={{ backgroundColor: `#${color.toString(16).padStart(6, '0')}` }}
            />
            <span className="text-sm capitalize">
              {status.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* Canvas 3D */}
      <div 
        ref={mountRef} 
        className="w-full rounded-lg border-2 border-gray-300 shadow-lg bg-gray-100"
        style={{ height: '600px' }}
      />

      {/* Instruções */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-900">
        <p className="font-semibold mb-2">Controles:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Clique e arraste com o botão esquerdo para rotacionar</li>
          <li>Use a roda do mouse para zoom</li>
          <li>Clique com o botão direito e arraste para mover (pan)</li>
          <li>Lotes em destaque indicam o lote atual sendo visualizado</li>
        </ul>
      </div>
    </div>
  );
}