import React from "react";
import { Redirect, Route } from 'react-router-dom';
import "./App.css";
import Chat from './components/Chat';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import useAuthUser from './hooks/useAuthUser';
import useWindowSize from "./hooks/useWindowSize";

export default function App () {
  const page = useWindowSize();
  const user = useAuthUser();

  if (!user) {
    return <Login />
  }
  return (
    <div className="app" style={{ ...page }}>
      <Redirect to={page.isMobile ? "/chats" : "/"} />
      <div className="app__body">
        <Sidebar page={page} user={user} />
        <Route path="/room/:roomId" >
          <Chat user={user} page={page} />
        </Route>
      </div>
    </div>
  );
}
