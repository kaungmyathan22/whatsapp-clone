import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APPID,
};


const app = !firebase.apps.length
    ? firebase.initializeApp(firebaseConfig)
    : firebase.app();

const db = app.firestore();
const auth = app.auth();
const storage = app.storage().ref("images");
const audioStorage = app.storage().ref("audios");
const provider = new firebase.auth.GoogleAuthProvider();
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
// const serverTimestamp = firebase.database.ServerValue.TIMESTAMP;
const increment = firebase.firestore.FieldValue.increment;
export { auth, provider, storage, increment, audioStorage, serverTimestamp };
export default db;