// import { Button, ButtonGroup } from "@chakra-ui/react"
import './App.css';
import { Route } from "react-router-dom";
import Homepage from './pages/Homepage';
import Chatpage from './pages/Chatpage';
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <div className="App">
      <Route path="/" component={Homepage} exact />
      <Route path="/chats" component={Chatpage} exact />

      <Toaster />
    </div>
  );
}

export default App;
