import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CORE from '@thatopen/components';

interface IFCViewerProps {
  file: File | null;
}

const IFCViewer: React.FC<IFCViewerProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<CORE.Components | null>(null);
  const worldRef = useRef<CORE.World | null>(null);
  const fragmentsRef = useRef<CORE.FragmentsManager | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [modelsCount, setModelsCount] = useState(0);
  const [customFragPath, setCustomFragPath] = useState('');
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });

  // 1) Инициализация точно как в примере
  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      try {
        console.log('🚀 [INIT] Начинаем инициализацию вьюера...');

        // Components (как в примере)
        console.log('🔧 [INIT] Создаем Components...');
        const components = new CORE.Components();
        componentsRef.current = components;
        console.log('✅ [INIT] Components создан:', components);

        // Worlds (как в примере)
        console.log('🌍 [INIT] Создаем World...');
        const worlds = components.get(CORE.Worlds);
        const world = worlds.create<
          CORE.SimpleScene,
          CORE.OrthoPerspectiveCamera,
          CORE.SimpleRenderer
        >();
        worldRef.current = world;
        console.log('✅ [INIT] World создан:', world);

        // Scene (как в примере)
        console.log('🎬 [INIT] Настраиваем Scene...');
        world.scene = new CORE.SimpleScene(components);
        world.scene.setup();
        world.scene.three.background = new THREE.Color(0x1a1a1a); // Темный фон
        console.log('✅ [INIT] Scene настроена:', world.scene);

        // Renderer (как в примере)
        console.log('🎨 [INIT] Создаем Renderer...');
        world.renderer = new CORE.SimpleRenderer(components, containerRef.current!);
        console.log('✅ [INIT] Renderer создан:', world.renderer);

        // Camera (как в примере)
        console.log('📷 [INIT] Настраиваем Camera...');
        world.camera = new CORE.OrthoPerspectiveCamera(components);
        await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);
        console.log('✅ [INIT] Camera настроена:', world.camera);

        // Components init (как в примере)
        console.log('⚙️ [INIT] Инициализируем Components...');
        components.init();
        console.log('✅ [INIT] Components инициализированы');

        // Grid (как в примере)
        console.log('📐 [INIT] Создаем Grid...');
        components.get(CORE.Grids).create(world);
        console.log('✅ [INIT] Grid создан');

        // FragmentsManager (как в примере)
        console.log('📦 [INIT] Настраиваем FragmentsManager...');
        const githubUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
        console.log('🌐 [INIT] Загружаем worker с:', githubUrl);
        const fetchedUrl = await fetch(githubUrl);
        const workerBlob = await fetchedUrl.blob();
        const workerFile = new File([workerBlob], "worker.mjs", {
          type: "text/javascript",
        });
        const workerUrl = URL.createObjectURL(workerFile);
        console.log('✅ [INIT] Worker загружен, URL:', workerUrl);

        const fragments = components.get(CORE.FragmentsManager);
        console.log('🔧 [INIT] FragmentsManager получен:', fragments);
        fragments.init(workerUrl);
        fragmentsRef.current = fragments;
        console.log('✅ [INIT] FragmentsManager инициализирован');

        // Camera controls (как в примере)
        console.log('🎮 [INIT] Настраиваем Camera controls...');
        world.camera.controls.addEventListener("rest", () => {
          console.log('🔄 [CAMERA] Camera rest event triggered');
          fragments.core.update(true);
        });
        
        console.log('✅ [INIT] Camera controls настроены');

        // Fragments list (как в примере)
        console.log('📋 [INIT] Настраиваем Fragments list handlers...');
        fragments.list.onItemSet.add(({ value: model }) => {
          console.log('📦 [FRAGMENT] onItemSet triggered!');
          console.log('📦 [FRAGMENT] Модель:', model);
          console.log('📦 [FRAGMENT] model.object:', model.object);
          console.log('📦 [FRAGMENT] model.modelId:', model.modelId);
          
          console.log('📷 [FRAGMENT] Настраиваем камеру для модели...');
          model.useCamera(world.camera.three);
          console.log('✅ [FRAGMENT] Камера настроена');
          
          
          console.log('🎬 [FRAGMENT] Добавляем модель в сцену...');
          world.scene.three.add(model.object);
          console.log('✅ [FRAGMENT] Модель добавлена в сцену');
          
          console.log('🔍 [FRAGMENT] Проверяем содержимое сцены:');
          console.log('📊 [FRAGMENT] Количество объектов в сцене:', world.scene.three.children.length);
          console.log('🎯 [FRAGMENT] Объекты в сцене:', world.scene.three.children.map(child => ({
            type: child.type,
            name: child.name,
            visible: child.visible,
            position: child.position,
            userData: child.userData
          })));
          
          console.log('🔄 [FRAGMENT] Обновляем рендер...');
          fragments.core.update(true);
          console.log('✅ [FRAGMENT] Рендер обновлен');
          
          setModelsCount(fragments.list.size);
          console.log('📊 [FRAGMENT] Количество моделей:', fragments.list.size);
          
          // Диагностика памяти
          console.log('🧠 [MEMORY] Диагностика памяти:');
          if ((performance as any).memory) {
            const mem = (performance as any).memory;
            console.log('📊 [MEMORY] Used JS Heap:', Math.round(mem.usedJSHeapSize / 1024 / 1024), 'MB');
            console.log('📊 [MEMORY] Total JS Heap:', Math.round(mem.totalJSHeapSize / 1024 / 1024), 'MB');
            console.log('📊 [MEMORY] JS Heap Limit:', Math.round(mem.jsHeapSizeLimit / 1024 / 1024), 'MB');
          }
          
          // Детальная диагностика памяти 3D объектов
          let geometryCount = 0;
          let materialCount = 0;
          let totalVertices = 0;
          let totalFaces = 0;
          let totalMemoryEstimate = 0;
          
          world.scene.three.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              geometryCount++;
              
              // Анализируем геометрию
              if (child.geometry) {
                const geometry = child.geometry;
                if (geometry.attributes.position) {
                  const vertices = geometry.attributes.position.count;
                  totalVertices += vertices;
                  
                  // Оценка памяти: позиции (3 * 4 байта) + нормали (3 * 4 байта) + UV (2 * 4 байта)
                  const vertexMemory = vertices * (3 + 3 + 2) * 4; // байты
                  totalMemoryEstimate += vertexMemory;
                }
                
                if (geometry.index) {
                  const faces = geometry.index.count / 3;
                  totalFaces += faces;
                  
                  // Индексы: 3 * 2 байта на треугольник
                  const indexMemory = geometry.index.count * 2;
                  totalMemoryEstimate += indexMemory;
                }
              }
              
              // Анализируем материалы
              if (child.material) {
                if (Array.isArray(child.material)) {
                  materialCount += child.material.length;
                  totalMemoryEstimate += child.material.length * 1024; // ~1KB на материал
                } else {
                  materialCount++;
                  totalMemoryEstimate += 1024; // ~1KB на материал
                }
              }
            }
          });
          
          console.log('🎨 [MEMORY] Детальная статистика 3D:');
          console.log('  📊 Геометрий:', geometryCount);
          console.log('  🎭 Материалов:', materialCount);
          console.log('  📐 Вершин:', totalVertices.toLocaleString());
          console.log('  🔺 Треугольников:', totalFaces.toLocaleString());
          console.log('  💾 Оценка памяти 3D:', Math.round(totalMemoryEstimate / 1024 / 1024), 'MB');
          
          // Проверяем bounding box модели
          setTimeout(() => {
            console.log('🔍 [FRAGMENT] Проверяем bounding box модели...');
            const box = new THREE.Box3().setFromObject(model.object);
            console.log('📦 [FRAGMENT] Bounding box:', box);
            if (!box.isEmpty()) {
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());
              console.log('📍 [FRAGMENT] Центр модели:', center);
              console.log('📏 [FRAGMENT] Размер модели:', size);
            } else {
              console.warn('⚠️ [FRAGMENT] Bounding box пустой!');
            }
          }, 100);
        });
        console.log('✅ [INIT] Fragments list handlers настроены');

        // Отслеживаем удаление моделей
        fragments.list.onItemDeleted.add(() => {
          console.log('🗑️ [FRAGMENT] onItemDeleted triggered');
          setModelsCount(fragments.list.size);
          console.log('📊 [FRAGMENT] Количество моделей после удаления:', fragments.list.size);
        });
        console.log('✅ [INIT] Fragments deletion handlers настроены');

        setViewerReady(true);
        console.log('✅ [INIT] Вьюер готов!');
        console.log('🎯 [INIT] Финальное состояние:');
        console.log('  - Components:', !!componentsRef.current);
        console.log('  - World:', !!worldRef.current);
        console.log('  - Fragments:', !!fragmentsRef.current);
        console.log('  - Viewer ready:', true);

      } catch (e: any) {
        console.error('❌ [INIT] Ошибка инициализации:', e);
        console.error('❌ [INIT] Stack trace:', e.stack);
        setError(`Ошибка инициализации: ${e?.message ?? 'Неизвестная ошибка'}`);
      }
    };

    init();
  }, []);

  // 2) Загрузка кастомного фрагмента
  const loadCustomFragment = async () => {
    if (!fragmentsRef.current || !viewerReady || !customFragPath.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const fragments = fragmentsRef.current;
      const path = customFragPath.startsWith('/') ? customFragPath : `/fragments/${customFragPath}`;
      
      console.log('🚀 [CUSTOM] Загружаем кастомный фрагмент:', path);
      
      const modelId = path.split("/").pop()?.split(".").shift() || 'custom';
      console.log(`🆔 [CUSTOM] Model ID: ${modelId}`);
      
      const file = await fetch(path);
      if (!file.ok) {
        throw new Error(`Файл не найден: ${path}`);
      }
      
      const buffer = await file.arrayBuffer();
      console.log(`📦 [CUSTOM] Буфер получен, размер: ${buffer.byteLength} байт`);
      
      const result = await fragments.core.load(buffer, { modelId });
      console.log(`✅ [CUSTOM] Фрагмент загружен:`, result);
      
      setCustomFragPath(''); // Очищаем поле ввода
      
    } catch (e: any) {
      console.error('❌ [CUSTOM] Ошибка загрузки кастомного фрагмента:', e);
      setError(`Не удалось загрузить фрагмент: ${e?.message ?? 'Неизвестная ошибка'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3) Загрузка фрагментов (как в примере)
  const loadFragments = async () => {
    console.log('🚀 [LOAD] Начинаем загрузку фрагментов...');
    console.log('🔍 [LOAD] Проверяем условия:');
    console.log('  - fragmentsRef.current:', !!fragmentsRef.current);
    console.log('  - viewerReady:', viewerReady);
    console.log('  - isLoading:', isLoading);
    
    if (!fragmentsRef.current || !viewerReady) {
      console.warn('⚠️ [LOAD] Условия не выполнены, прерываем загрузку');
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log('⏳ [LOAD] Устанавливаем состояние загрузки');

    try {
      const fragments = fragmentsRef.current;
      console.log('📦 [LOAD] Fragments manager получен:', fragments);
      console.log('📊 [LOAD] Текущее количество моделей:', fragments.list.size);
      
      // Локальные фрагменты из папки public/fragments
      const allFragPaths = [
        "/fragments/2024-09-22 Дорохова_Топливо.ifc.frag",
        "/fragments/2024-10-09 Дорохова Газоходы.ifc.frag",
        "/fragments/NCBC_DC_B_AR_R24.ifc.frag",
        "/fragments/NCBC_DC_B_AUP_R24.ifc.frag",
        "/fragments/NCBC_DC_B_EOM_R24_Mazur_E.ifc.frag",
        "/fragments/NCBC_DC_B_KITSO_R24.ifc.frag",
        "/fragments/NCBC_DC_B_KR1_R24_DZ.ifc.frag",
        "/fragments/NCBC_DC_B_KR2_R24.ifc.frag",
        "/fragments/NCBC_DC_B_KR3_R24.ifc.frag",
        "/fragments/NCBC_DC_B_OV_R24.ifc.frag",
        "/fragments/NCBC_DC_B_OV2.2.ifc.frag",
        "/fragments/NCBC_DC_B_SS_R24_Mazur_E.ifc.frag",
        "/fragments/NCBC_DC_B_TS_R24.ifc.frag",
      ];
      
             // Загружаем все фрагменты сразу
             const fragPaths = allFragPaths;
             console.log('📋 [LOAD] Пути к фрагментам (все', fragPaths.length, '):', fragPaths);

             console.log('🔄 [LOAD] Начинаем загрузку всех фрагментов одновременно...');
             setLoadingProgress({ current: 0, total: fragPaths.length });
             
             // Загружаем все фрагменты параллельно
             const results = await Promise.all(fragPaths.map(async (path, i) => {
               console.log(`📥 [LOAD-${i}] Загружаем фрагмент: ${path}`);

               const modelId = path.split("/").pop()?.split(".").shift();
               console.log(`🆔 [LOAD-${i}] Model ID: ${modelId}`);

               if (!modelId) {
                 console.warn(`⚠️ [LOAD-${i}] Model ID не найден для ${path}`);
                 return null;
               }

               console.log(`🌐 [LOAD-${i}] Запрашиваем файл...`);
               const file = await fetch(path);
               console.log(`📡 [LOAD-${i}] Ответ получен:`, file.status, file.statusText);

               const buffer = await file.arrayBuffer();
               console.log(`📦 [LOAD-${i}] Буфер получен, размер: ${buffer.byteLength} байт`);

               console.log(`🔄 [LOAD-${i}] Загружаем в fragments.core...`);
               // this is the main function to load the fragments (как в примере)
               const result = await fragments.core.load(buffer, { modelId });
               console.log(`✅ [LOAD-${i}] Фрагмент загружен:`, result);
               console.log(`📊 [LOAD-${i}] Количество моделей после загрузки: ${fragments.list.size}`);

               // Диагностика памяти после каждой загрузки
               if ((performance as any).memory) {
                 const mem = (performance as any).memory;
                 console.log(`🧠 [MEMORY-${i}] Used JS Heap:`, Math.round(mem.usedJSHeapSize / 1024 / 1024), 'MB');
               }

               // Обновляем прогресс
               setLoadingProgress({ current: i + 1, total: fragPaths.length });

               return result;
             }));
      
      console.log('✅ [LOAD] Все фрагменты загружены успешно!');
      console.log('📊 [LOAD] Результаты загрузки:', results);
      console.log('📊 [LOAD] Финальное количество моделей:', fragments.list.size);
      
      // Проверяем состояние сцены после загрузки
      if (worldRef.current) {
        console.log('🔍 [LOAD] Проверяем состояние сцены после загрузки:');
        console.log('📊 [LOAD] Объекты в сцене:', worldRef.current.scene.three.children.length);
        console.log('🎯 [LOAD] Детали объектов:', worldRef.current.scene.three.children.map(child => ({
          type: child.type,
          name: child.name,
          visible: child.visible,
          position: child.position,
          userData: child.userData
        })));
      }

    } catch (e: any) {
      console.error('❌ [LOAD] Ошибка загрузки фрагментов:', e);
      console.error('❌ [LOAD] Stack trace:', e.stack);
      setError(`Не удалось загрузить фрагменты: ${e?.message ?? 'Неизвестная ошибка'}`);
    } finally {
      setIsLoading(false);
      console.log('⏹️ [LOAD] Загрузка завершена, снимаем состояние загрузки');
    }
  };

  // 3) Скачивание фрагментов (как в примере)
  const downloadFragments = async () => {
    if (!fragmentsRef.current) return;

    try {
      const fragments = fragmentsRef.current;
      
      for (const [, model] of fragments.list) {
        const fragsBuffer = await model.getBuffer(false);
        const file = new File([fragsBuffer], `${model.modelId}.frag`);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(link.href);
      }
      
    } catch (e: any) {
      console.error('❌ Ошибка при скачивании фрагментов:', e);
      setError(`Не удалось скачать фрагменты: ${e?.message ?? 'Неизвестная ошибка'}`);
    }
  };

  // 4) Удаление архитектурной модели (как в примере)
  const deleteArchModel = () => {
    if (!fragmentsRef.current) return;
    
    const fragments = fragmentsRef.current;
    const modelIds = [...fragments.list.keys()];
    const modelId = modelIds.find((key) => /arq/.test(key));
    if (!modelId) return;
    fragments.core.disposeModel(modelId);
    console.log(`🗑️ Удалена архитектурная модель: ${modelId}`);
  };

  // 5) Детальный анализ памяти
  const analyzeMemory = () => {
    console.log('🔍 [ANALYZE] Детальный анализ памяти...');
    
    if (!worldRef.current) {
      console.warn('⚠️ [ANALYZE] World не инициализирован');
      return;
    }
    
    const world = worldRef.current;
    let totalVertices = 0;
    let totalFaces = 0;
    let geometryCount = 0;
    let materialCount = 0;
    let textureCount = 0;
    let totalMemoryEstimate = 0;
    
    // Анализируем все объекты в сцене
    world.scene.three.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        geometryCount++;
        
        // Геометрия
        if (child.geometry) {
          const geometry = child.geometry;
          
          // Вершины
          if (geometry.attributes.position) {
            const vertices = geometry.attributes.position.count;
            totalVertices += vertices;
            totalMemoryEstimate += vertices * 8 * 4; // позиции + нормали + UV
          }
          
          // Индексы
          if (geometry.index) {
            const faces = geometry.index.count / 3;
            totalFaces += faces;
            totalMemoryEstimate += geometry.index.count * 2;
          }
        }
        
        // Материалы
        if (child.material) {
          if (Array.isArray(child.material)) {
            materialCount += child.material.length;
            child.material.forEach(mat => {
              totalMemoryEstimate += 2048; // ~2KB на материал
              
              // Текстуры в материалах
              if (mat.map) textureCount++;
              if (mat.normalMap) textureCount++;
              if (mat.roughnessMap) textureCount++;
              if (mat.metalnessMap) textureCount++;
            });
          } else {
            materialCount++;
            totalMemoryEstimate += 2048;
            
            if (child.material.map) textureCount++;
            if (child.material.normalMap) textureCount++;
            if (child.material.roughnessMap) textureCount++;
            if (child.material.metalnessMap) textureCount++;
          }
        }
      }
    });
    
    // Оценка памяти текстур
    const textureMemory = textureCount * 1024 * 1024; // ~1MB на текстуру
    totalMemoryEstimate += textureMemory;
    
    console.log('📊 [ANALYZE] Результаты анализа:');
    console.log('  🎯 Геометрий:', geometryCount);
    console.log('  🎭 Материалов:', materialCount);
    console.log('  🖼️ Текстур:', textureCount);
    console.log('  📐 Вершин:', totalVertices.toLocaleString());
    console.log('  🔺 Треугольников:', totalFaces.toLocaleString());
    console.log('  💾 Оценка памяти 3D:', Math.round(totalMemoryEstimate / 1024 / 1024), 'MB');
    console.log('  🖼️ Память текстур:', Math.round(textureMemory / 1024 / 1024), 'MB');
    
    // Сравнение с реальной памятью
    if ((performance as any).memory) {
      const mem = (performance as any).memory;
      const realMemory = mem.usedJSHeapSize;
      const estimatedMemory = totalMemoryEstimate;
      const ratio = realMemory / estimatedMemory;
      
      console.log('📈 [ANALYZE] Сравнение:');
      console.log('  🔴 Реальная память:', Math.round(realMemory / 1024 / 1024), 'MB');
      console.log('  🔵 Оценка 3D:', Math.round(estimatedMemory / 1024 / 1024), 'MB');
      console.log('  📊 Коэффициент:', ratio.toFixed(2));
      
      if (ratio > 3) {
        console.warn('⚠️ [ANALYZE] Память превышает оценку в', ratio.toFixed(1), 'раз! Возможны утечки.');
      }
    }
  };

  // 6) Удаление всех моделей (как в примере)
  const deleteAllModels = () => {
    console.log('🗑️ [DELETE] Начинаем удаление всех моделей...');
    console.log('🔍 [DELETE] Проверяем fragmentsRef.current:', !!fragmentsRef.current);
    
    if (!fragmentsRef.current) {
      console.warn('⚠️ [DELETE] fragmentsRef.current отсутствует, прерываем удаление');
      return;
    }
    
    const fragments = fragmentsRef.current;
    console.log('📊 [DELETE] Количество моделей до удаления:', fragments.list.size);
    console.log('📋 [DELETE] ID моделей для удаления:', [...fragments.list.keys()]);
    
    for (const [modelId] of fragments.list) {
      console.log(`🗑️ [DELETE] Удаляем модель: ${modelId}`);
      fragments.core.disposeModel(modelId);
    }
    
    console.log('✅ [DELETE] Все модели удалены');
    console.log('📊 [DELETE] Количество моделей после удаления:', fragments.list.size);
    
    // Проверяем состояние сцены после удаления
    if (worldRef.current) {
      console.log('🔍 [DELETE] Проверяем состояние сцены после удаления:');
      console.log('📊 [DELETE] Объекты в сцене:', worldRef.current.scene.three.children.length);
    }
  };


  return (
    <div className="ifc-viewer" style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0,
      overflow: 'hidden'
    }}>
      {/* 3D Сцена на весь экран */}
      <div
        ref={containerRef}
        className="viewer-container"
        style={{
          position: 'absolute',
          top: '32px',
          left: '32px',
          right: '32px',
          bottom: '32px',
          zIndex: 1
        }}
      />

      {/* Панель управления поверх сцены */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        minWidth: '300px'
      }}>
        {/* Информация о моделях */}
               <div style={{
                 marginBottom: '15px',
                 fontSize: '16px',
                 color: '#333',
                 fontWeight: '500'
               }}>
                 Загружено моделей: <strong style={{ color: '#007bff' }}>{modelsCount}</strong>
               </div>

        
        {/* Поле для загрузки кастомного фрагмента */}
        <div style={{ 
          marginBottom: '15px', 
          display: 'flex', 
          gap: '10px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            value={customFragPath}
            onChange={(e) => setCustomFragPath(e.target.value)}
            placeholder="Имя файла фрагмента (например: my_model.frag)"
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
          <button
            onClick={loadCustomFragment}
            disabled={isLoading || !customFragPath.trim()}
            style={{
              padding: '10px 16px',
              backgroundColor: (!isLoading && customFragPath.trim()) ? '#17a2b8' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (!isLoading && customFragPath.trim()) ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            📁 Загрузить
          </button>
        </div>
        
        {/* Кнопки действий */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Кнопка загрузки - показываем только если нет моделей */}
          {modelsCount === 0 && (
            <button
              onClick={() => {
                console.log('🖱️ [BUTTON] Кнопка "Загрузить фрагменты" нажата');
                console.log('🔍 [BUTTON] Состояние перед загрузкой:');
                console.log('  - modelsCount:', modelsCount);
                console.log('  - isLoading:', isLoading);
                console.log('  - viewerReady:', viewerReady);
                console.log('  - fragmentsRef.current:', !!fragmentsRef.current);
                loadFragments();
              }}
              disabled={isLoading}
              style={{
                padding: '12px 20px',
                backgroundColor: !isLoading ? '#28a745' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: !isLoading ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                boxShadow: !isLoading ? '0 2px 8px rgba(40, 167, 69, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.3)';
                }
              }}
            >
              {isLoading ? '⏳ Загрузка...' : '📦 Загрузить фрагменты'}
            </button>
          )}

          {/* Кнопка удаления архитектурной модели - показываем только если есть arq модель */}
          {modelsCount > 0 && fragmentsRef.current && (() => {
            const fragments = fragmentsRef.current!;
            const hasArchModel = [...fragments.list.keys()].some((key) => /arq/.test(key));
            return hasArchModel;
          })() && (
            <button
              onClick={deleteArchModel}
              disabled={isLoading}
              style={{
                padding: '12px 20px',
                backgroundColor: !isLoading ? '#dc3545' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: !isLoading ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                boxShadow: !isLoading ? '0 2px 8px rgba(220, 53, 69, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 53, 69, 0.3)';
                }
              }}
            >
              🗑️ Удалить архитектурную модель
            </button>
          )}

          {/* Кнопки для загруженных моделей */}
          {modelsCount > 0 && (
            <>
              <button
                onClick={downloadFragments}
                disabled={isLoading}
                style={{
                  padding: '12px 20px',
                  backgroundColor: !isLoading ? '#ffc107' : '#ccc',
                  color: 'black',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !isLoading ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  boxShadow: !isLoading ? '0 2px 8px rgba(255, 193, 7, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 193, 7, 0.3)';
                  }
                }}
              >
                💾 Скачать фрагменты
              </button>
              
              <button
                onClick={analyzeMemory}
                disabled={isLoading}
                style={{
                  padding: '12px 20px',
                  backgroundColor: !isLoading ? '#17a2b8' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !isLoading ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  boxShadow: !isLoading ? '0 2px 8px rgba(23, 162, 184, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(23, 162, 184, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(23, 162, 184, 0.3)';
                  }
                }}
              >
                🔍 Анализ памяти
              </button>
              
              <button
                onClick={() => {
                  console.log('🖱️ [BUTTON] Кнопка "Удалить все модели" нажата');
                  console.log('🔍 [BUTTON] Состояние перед удалением:');
                  console.log('  - modelsCount:', modelsCount);
                  console.log('  - fragmentsRef.current:', !!fragmentsRef.current);
                  if (fragmentsRef.current) {
                    console.log('  - fragments.list.size:', fragmentsRef.current.list.size);
                  }
                  deleteAllModels();
                }}
                disabled={isLoading}
                style={{
                  padding: '12px 20px',
                  backgroundColor: !isLoading ? '#dc3545' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !isLoading ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  boxShadow: !isLoading ? '0 2px 8px rgba(220, 53, 69, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 53, 69, 0.3)';
                  }
                }}
              >
                🗑️ Удалить все модели
              </button>
            </>
          )}
        </div>
      </div>

             {/* Индикатор загрузки с прогрессом */}
             {isLoading && (
               <div style={{
                 position: 'absolute',
                 top: '50%',
                 left: '50%',
                 transform: 'translate(-50%, -50%)',
                 zIndex: 20,
                 padding: '30px 40px',
                 backgroundColor: 'rgba(0, 0, 0, 0.9)',
                 color: 'white',
                 borderRadius: '12px',
                 fontSize: '18px',
                 fontWeight: '500',
                 boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                 backdropFilter: 'blur(10px)',
                 border: '1px solid rgba(255, 255, 255, 0.1)',
                 minWidth: '300px'
               }}>
                 <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                   ⏳ Загрузка фрагментов...
                 </div>
                 
                 {loadingProgress.total > 0 && (
                   <div>
                     <div style={{
                       display: 'flex',
                       justifyContent: 'space-between',
                       marginBottom: '10px',
                       fontSize: '14px'
                     }}>
                       <span>Прогресс:</span>
                       <span>{loadingProgress.current} / {loadingProgress.total}</span>
                     </div>
                     
                     <div style={{
          width: '100%',
                       height: '8px',
                       backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          overflow: 'hidden'
                     }}>
                       <div style={{
                         width: `${(loadingProgress.current / loadingProgress.total) * 100}%`,
                         height: '100%',
                         backgroundColor: '#007bff',
                         transition: 'width 0.3s ease'
                       }} />
                     </div>
                     
                     <div style={{
                       marginTop: '10px',
                       fontSize: '12px',
                       textAlign: 'center',
                       color: 'rgba(255, 255, 255, 0.7)'
                     }}>
                       {Math.round((loadingProgress.current / loadingProgress.total) * 100)}% завершено
                     </div>
                   </div>
                 )}
               </div>
             )}

      {/* Сообщение об ошибке */}
      {error && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          zIndex: 10,
          padding: '15px 20px',
          backgroundColor: 'rgba(248, 215, 218, 0.95)',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Индикатор готовности вьюера */}
      {!viewerReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          padding: '30px 40px',
          backgroundColor: 'rgba(240, 240, 240, 0.95)',
          color: '#666',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: '500',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          🔄 Инициализация вьюера...
        </div>
      )}
    </div>
  );
};

export default IFCViewer;