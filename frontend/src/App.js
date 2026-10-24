// import { Button, ButtonGroup } from "@chakra-ui/react"
import './App.css';
import { Route } from "react-router-dom";
import Homepage from './pages/Homepage';
import Chatpage from './pages/Chatpage';
import InvitePage from './pages/InvitePage';
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <div className="App">
      <Route path="/" component={Homepage} exact />
      <Route path="/chats" component={Chatpage} exact />
      <Route path="/invite/:code" component={InvitePage} exact />

      <Toaster />
    </div>
  );
}

export default App;
