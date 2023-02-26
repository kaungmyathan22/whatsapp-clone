import { Button, CircularProgress } from '@material-ui/core';
import { useState } from 'react';
import { auth, provider } from '../firebase';
import "./Login.css";

export default function Login () {
  const [loading, setLoading] = useState(false);

  function login () {
    setLoading(true);
    auth.signInWithPopup(provider).finally(() => setLoading(false));
  }

  if (loading) {
    return <div className='loader'>
      <CircularProgress />
    </div>
  }

  return <div className="app">
    <div className="login">
      <div className="login__container">
        <img src="/login-logo.png" alt="Logo" />
        <div className="login__text">
          <h1>Sign in to whatsapp</h1>
        </div>
        <Button onClick={login}>
          Sign In With Google
        </Button>
      </div>
    </div>
  </div>;
}
