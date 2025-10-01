import { useState } from 'react'
import './App.css'
import FileViewer from './components/FileViewer'
import IFCViewer from './components/IFCViewer'
import FileUpload from './components/FileUpload'

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleClearFile = () => {
    setSelectedFile(null)
  }

  return (
    <div className="App">
      <header className="App-header">
        {/* <h1>IFC 3D Viewer</h1>
        <p>Просмотр IFC файлов и других файлов в виде 3D моделей</p> */}
        
        <div className="controls">
          {/* <FileUpload onFileSelect={handleFileSelect} /> */}
          {selectedFile && (
            <div className="file-info">
              <p>Выбранный файл: <strong>{selectedFile.name}</strong></p>
              <button onClick={handleClearFile} className="clear-button">
                Очистить
              </button>
            </div>
          )}
        </div>

        <div className="viewer-section">
          <h3>3D Модель</h3>
          <IFCViewer file={selectedFile} />
        </div>
      </header>
    </div>
  )
}

export default App
