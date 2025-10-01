import React, { useEffect, useRef, useState } from 'react';
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

  // 1) Инициализация точно как в примере
  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      try {
        // Components (как в примере)
        const components = new CORE.Components();
        componentsRef.current = components;

        // Worlds (как в примере)
        const worlds = components.get(CORE.Worlds);
        const world = worlds.create<
          CORE.SimpleScene,
          CORE.OrthoPerspectiveCamera,
          CORE.SimpleRenderer
        >();
        worldRef.current = world;

        // Scene (как в примере)
        world.scene = new CORE.SimpleScene(components);
        world.scene.setup();
        world.scene.three.background = null;

        // Renderer (как в примере)
        world.renderer = new CORE.SimpleRenderer(components, containerRef.current!);

        // Camera (как в примере)
        world.camera = new CORE.OrthoPerspectiveCamera(components);
        await world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);

        // Components init (как в примере)
        components.init();

        // Grid (как в примере)
        components.get(CORE.Grids).create(world);

        // FragmentsManager (как в примере)
        const githubUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
        const fetchedUrl = await fetch(githubUrl);
        const workerBlob = await fetchedUrl.blob();
        const workerFile = new File([workerBlob], "worker.mjs", {
          type: "text/javascript",
        });
        const workerUrl = URL.createObjectURL(workerFile);

        const fragments = components.get(CORE.FragmentsManager);
        fragments.init(workerUrl);
        fragmentsRef.current = fragments;

        // Camera controls (как в примере)
        world.camera.controls.addEventListener("rest", () =>
          fragments.core.update(true)
        );

        // Fragments list (как в примере)
        fragments.list.onItemSet.add(({ value: model }) => {
          model.useCamera(world.camera.three);
          world.scene.three.add(model.object);
          fragments.core.update(true);
          setModelsCount(fragments.list.size);
        });

        // Отслеживаем удаление моделей
        fragments.list.onItemDeleted.add(() => {
          setModelsCount(fragments.list.size);
        });

        setViewerReady(true);
        console.log('✅ Вьюер готов');

      } catch (e: any) {
        console.error('❌ Ошибка инициализации:', e);
        setError(`Ошибка инициализации: ${e?.message ?? 'Неизвестная ошибка'}`);
      }
    };

    init();
  }, []);

  // 2) Загрузка фрагментов (как в примере)
  const loadFragments = async () => {
    if (!fragmentsRef.current || !viewerReady) return;

    setIsLoading(true);
    setError(null);

    try {
      const fragments = fragmentsRef.current;
      
      // Тестовые фрагменты из примера
      const fragPaths = [
        "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag",
        "https://thatopen.github.io/engine_components/resources/frags/school_str.frag",
      ];

      // Promise.all loads models concurrently for faster execution (как в примере)
      await Promise.all(
        fragPaths.map(async (path) => {
          const modelId = path.split("/").pop()?.split(".").shift();
          if (!modelId) return null;
          const file = await fetch(path);
          const buffer = await file.arrayBuffer();
          // this is the main function to load the fragments (как в примере)
          return fragments.core.load(buffer, { modelId });
        }),
      );
      
      console.log('✅ Фрагменты загружены успешно');

    } catch (e: any) {
      console.error('❌ Ошибка загрузки фрагментов:', e);
      setError(`Не удалось загрузить фрагменты: ${e?.message ?? 'Неизвестная ошибка'}`);
    } finally {
      setIsLoading(false);
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

  // 5) Удаление всех моделей (как в примере)
  const deleteAllModels = () => {
    if (!fragmentsRef.current) return;
    
    const fragments = fragmentsRef.current;
    for (const [modelId] of fragments.list) {
      fragments.core.disposeModel(modelId);
    }
    console.log('🗑️ Удалены все модели');
  };

  return (
    <div className="ifc-viewer">
      {/* Панель управления */}
      <div style={{ marginBottom: '10px' }}>
        {/* Информация о моделях */}
        <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
          Загружено моделей: <strong>{modelsCount}</strong>
        </div>
        
        {/* Кнопки действий */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Кнопка загрузки - показываем только если нет моделей */}
          {modelsCount === 0 && (
            <button
              onClick={loadFragments}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: !isLoading ? '#28a745' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isLoading ? 'pointer' : 'not-allowed'
              }}
            >
              {isLoading ? 'Загрузка...' : '📦 Загрузить фрагменты'}
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
                padding: '8px 16px',
                backgroundColor: !isLoading ? '#dc3545' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isLoading ? 'pointer' : 'not-allowed'
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
                  padding: '8px 16px',
                  backgroundColor: !isLoading ? '#ffc107' : '#ccc',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: !isLoading ? 'pointer' : 'not-allowed'
                }}
              >
                💾 Скачать фрагменты
              </button>
              
              <button
                onClick={deleteAllModels}
                disabled={isLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: !isLoading ? '#dc3545' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: !isLoading ? 'pointer' : 'not-allowed'
                }}
              >
                🗑️ Удалить все модели
              </button>
            </>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="viewer-container"
        style={{
          width: '100%',
          height: '60vh',
          maxHeight: '600px',
          minHeight: '400px',
          position: 'relative',
          border: '1px solid #ccc',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      />

      {error && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          borderRadius: '4px'
        }}>
          Загрузка фрагментов...
        </div>
      )}
    </div>
  );
};

export default IFCViewer;