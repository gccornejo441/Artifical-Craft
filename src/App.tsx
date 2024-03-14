import Chat from './components/Chat';
import ModalForm from './components/Form';
import './App.css';
import IPAddressDisplay from './components/IPAddress';
import { useWebSocket } from './hooks/useWebSocket';
import { useWebRTCClient } from './hooks/useWebRTCClient';


interface FormState {
  code: string;
}

function App() {
    const wsUrl = "ws://localhost:8080/ws"
  const { ws, wsState, message } = useWebSocket(wsUrl);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Tegridy</h1>
      </header>
      <main className='App-main'>
        <ModalForm ws={ws}  />
        <Chat ws={ws} messageFromWs={message} wsState={wsState} />
      </main>
      <footer className='App-footer'>
        <IPAddressDisplay />
      </footer>
    </div>
  );
}

export default App;
