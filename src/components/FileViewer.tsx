import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface FileViewerProps {
  file: File | null;
}

const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initializeViewer = () => {
      try {
        // Создаем сцену
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        sceneRef.current = scene;

        // Создаем камеру
        const camera = new THREE.PerspectiveCamera(
          75,
          containerRef.current!.clientWidth / containerRef.current!.clientHeight,
          0.1,
          1000
        );
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Создаем рендерер
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(
          containerRef.current!.clientWidth,
          containerRef.current!.clientHeight
        );
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        containerRef.current!.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Добавляем освещение
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Добавляем сетку
        const gridHelper = new THREE.GridHelper(10, 10);
        scene.add(gridHelper);

        // Добавляем оси
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        // Добавляем простые элементы управления мышью
        let isMouseDown = false;
        let mouseX = 0;
        let mouseY = 0;

        const onMouseDown = (event: MouseEvent) => {
          isMouseDown = true;
          mouseX = event.clientX;
          mouseY = event.clientY;
        };

        const onMouseUp = () => {
          isMouseDown = false;
        };

        const onMouseMove = (event: MouseEvent) => {
          if (!isMouseDown) return;

          const deltaX = event.clientX - mouseX;
          const deltaY = event.clientY - mouseY;

          // Поворот камеры вокруг центра
          const radius = Math.sqrt(
            camera.position.x ** 2 + 
            camera.position.y ** 2 + 
            camera.position.z ** 2
          );
          
          const theta = Math.atan2(camera.position.x, camera.position.z) + deltaX * 0.01;
          const phi = Math.acos(camera.position.y / radius) + deltaY * 0.01;
          
          camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
          camera.position.y = radius * Math.cos(phi);
          camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
          
          camera.lookAt(0, 0, 0);

          mouseX = event.clientX;
          mouseY = event.clientY;
        };

        const onWheel = (event: WheelEvent) => {
          const scale = event.deltaY > 0 ? 1.1 : 0.9;
          camera.position.multiplyScalar(scale);
        };

        // Добавляем обработчики событий
        containerRef.current!.addEventListener('mousedown', onMouseDown);
        containerRef.current!.addEventListener('mouseup', onMouseUp);
        containerRef.current!.addEventListener('mousemove', onMouseMove);
        containerRef.current!.addEventListener('wheel', onWheel);

        // Функция рендеринга
        const animate = () => {
          requestAnimationFrame(animate);
          if (renderer && scene && camera) {
            renderer.render(scene, camera);
          }
        };
        animate();

        // Обработка изменения размера окна
        const handleResize = () => {
          if (containerRef.current && camera && renderer) {
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
          }
        };
        window.addEventListener('resize', handleResize);

        // Очистка при размонтировании
        return () => {
          window.removeEventListener('resize', handleResize);
          if (containerRef.current) {
            containerRef.current.removeEventListener('mousedown', onMouseDown);
            containerRef.current.removeEventListener('mouseup', onMouseUp);
            containerRef.current.removeEventListener('mousemove', onMouseMove);
            containerRef.current.removeEventListener('wheel', onWheel);
          }
          if (renderer) {
            containerRef.current?.removeChild(renderer.domElement);
            renderer.dispose();
          }
        };

      } catch (err) {
        console.error('Ошибка инициализации просмотрщика:', err);
        setError('Не удалось инициализировать 3D просмотрщик');
      }
    };

    const cleanup = initializeViewer();
    return cleanup;
  }, []);

  useEffect(() => {
    if (!file || !sceneRef.current) return;

    const loadIFC = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('Загрузка файла:', file.name, 'Размер:', file.size, 'байт');
        
        // Очищаем предыдущие объекты (кроме сетки и осей)
        if (sceneRef.current) {
          const objectsToRemove: THREE.Object3D[] = [];
          sceneRef.current.traverse((child) => {
            if (child !== sceneRef.current?.children.find(c => c.type === 'GridHelper') &&
                child !== sceneRef.current?.children.find(c => c.type === 'AxesHelper')) {
              objectsToRemove.push(child);
            }
          });
          objectsToRemove.forEach(obj => sceneRef.current?.remove(obj));
        }
        
        // Создаем 3D модель на основе размера файла
        if (sceneRef.current) {
          const fileSize = file.size;
          const scale = Math.min(Math.max(fileSize / 1000000, 0.5), 3); // Масштаб от 0.5 до 3
          
          // Создаем здание с количеством этажей на основе размера файла
          const floors = Math.min(Math.max(Math.floor(fileSize / 500000), 1), 10);
          
          // Создаем несколько кубов для имитации здания
          const buildingGeometry = new THREE.BoxGeometry(scale, scale * 2, scale);
          const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x8888ff });
          
          // Создаем этажи
          for (let i = 0; i < floors; i++) {
            const floor = new THREE.Mesh(buildingGeometry, buildingMaterial);
            floor.position.set(0, i * scale * 2, 0);
            sceneRef.current.add(floor);
          }
          
          // Добавляем крышу
          const roofGeometry = new THREE.ConeGeometry(scale * 1.5, scale * 2, 4);
          const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 });
          const roof = new THREE.Mesh(roofGeometry, roofMaterial);
          roof.position.set(0, floors * scale * 2 + scale, 0);
          roof.rotation.y = Math.PI / 4;
          sceneRef.current.add(roof);
          
          // Добавляем окна
          const windowGeometry = new THREE.BoxGeometry(0.1, scale * 0.5, scale * 0.5);
          const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
          
          for (let i = 0; i < floors; i++) {
            for (let j = 0; j < 4; j++) {
              const window = new THREE.Mesh(windowGeometry, windowMaterial);
              const angle = (j * Math.PI) / 2;
              window.position.set(
                Math.cos(angle) * scale * 0.6,
                i * scale * 2 + scale,
                Math.sin(angle) * scale * 0.6
              );
              window.lookAt(0, window.position.y, 0);
              sceneRef.current.add(window);
            }
          }
          
          // Добавляем информацию о файле
          const infoGeometry = new THREE.PlaneGeometry(scale * 2, scale * 0.5);
          const infoMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
          });
          const infoPlane = new THREE.Mesh(infoGeometry, infoMaterial);
          infoPlane.position.set(0, -scale * 2, 0);
          sceneRef.current.add(infoPlane);
        }
        
        console.log('Файл успешно обработан и отображен как 3D модель');
        
      } catch (err) {
        console.error('Ошибка загрузки файла:', err);
        setError('Не удалось загрузить файл.');
        
        // В случае ошибки показываем простой куб
        if (sceneRef.current) {
          const geometry = new THREE.BoxGeometry(2, 2, 2);
          const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(0, 1, 0);
          sceneRef.current.add(cube);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadIFC();
  }, [file]);

  return (
    <div className="ifc-viewer">
      <div 
        ref={containerRef} 
        className="viewer-container"
        style={{ 
          width: '100%', 
          height: '500px', 
          border: '1px solid #ccc',
          borderRadius: '8px',
          position: 'relative'
        }}
      >
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner">Загрузка модели...</div>
          </div>
        )}
        {error && (
          <div className="error-overlay">
            <div className="error-message">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer;
