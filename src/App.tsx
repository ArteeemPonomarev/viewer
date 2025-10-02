import './App.css'
import IFCViewer from './components/IFCViewer'

function App() {
  return (
    <div className="App" style={{ 
      margin: 0, 
      padding: 0, 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden' 
    }}>
      <IFCViewer file={null} />
    </div>
  )
}

export default App
