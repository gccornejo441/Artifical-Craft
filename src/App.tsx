import React from 'react';
import logo from './logo.svg';
import './App.css';
import WebRTCChat from './components/WRTCConfig';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <WebRTCChat/>
      </header>
    </div>
  );
}

export default App;
