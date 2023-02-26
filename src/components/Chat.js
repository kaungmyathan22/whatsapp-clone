import { Avatar, CircularProgress, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddPhotoAlternate, ArrowBack, MoreVert } from '@material-ui/icons';
import Compressor from 'compressorjs';
import React, { useState } from "react";
import { useHistory, useParams } from 'react-router-dom';
import { v4 as uuid } from "uuid";
import db, { audioStorage, serverTimestamp, storage } from '../firebase';
import useChatMessages from '../hooks/useChatMessages';
import useRoom from '../hooks/useRoom';
import "./Chat.css";
import ChatFooter from './ChatFooter';
import ChatMessages from './ChatMessages';
import MediaPreview from './MediaPreview';

export default function Chat ({ user, page }) {
  const [image, setImage] = useState(null);
  const [src, setSrc] = useState('');
  const [input, setInput] = useState("");
  const [audioId, setAudioId] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { roomId } = useParams();

  const room = useRoom(roomId, user.uid);
  const messages = useChatMessages(roomId);
  const history = useHistory();

  function showPreview (event) {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setSrc(reader.result);
      }
    }
  }

  function onChange (event) {
    setInput(event.target.value);
  }

  async function sendMessage (event) {
    event.preventDefault();
    if (input.trim() || (input === "" && image)) {
      setInput("");
      if (image) {
        closePreview();
      }
      const imageName = uuid();
      const newMessage = image ? {
        name: user.displayName,
        message: input,
        uid: user.uid,
        timestamp: serverTimestamp(),
        time: new Date().toUTCString(),
        imageUrl: "uploading",
        imageName
      } : {
        name: user.displayName,
        message: input,
        uid: user.uid,
        timestamp: serverTimestamp(),
        time: new Date().toUTCString(),
      };
      db.collection("users").doc(user.uid).collection("chats").doc(roomId).set({
        name: room.name,
        photoURL: room.photoURL,
        timestamp: serverTimestamp()
      });
      const doc = await db.collection("rooms").doc(roomId).collection("messages").add(newMessage);
      if (image) {
        new Compressor(image, {
          quality: 0.8, maxWidth: 1920, async success (result) {
            setSrc("");
            setImage(null);
            await storage.child(imageName).put(result);
            const url = await storage.child(imageName).getDownloadURL();
            db.collection("rooms").doc(roomId).collection("messages").doc(doc.id).update({ imageUrl: url });

          }
        })
      }
    }
  }

  async function deleteRoom () {
    setOpenMenu(false);
    setIsDeleting(true);
    try {
      const roomRef = db.collection("rooms").doc(roomId);
      const roomMessages = await roomRef.collection("messages").get();
      const audioFiles = [];
      const imageFiles = [];
      roomMessages.docs.forEach(doc => {
        if (doc.data().audioName) {
          audioFiles.push(doc.data().audioName)
        } else if (doc.data().imageName) {
          imageFiles.push(doc.data().imageName)
        }
      });
      await Promise.all([
        ...roomMessages.docs.map(doc => doc.ref.delete()),
        ...imageFiles.map(image => storage.child(image).delete()),
        ...audioFiles.map(audio => audioStorage.child(audio).delete()),
        db.collection('users').doc(user.uid).collection("chats").doc(roomId).delete(),
        roomRef.delete()
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
      page.isMobile ? history.goBack() : history.replace("/")
    }
  }

  function closePreview () {
    setSrc("");
    setImage(null);
  }

  return <div className="chat">
    <div style={{ height: page.height }} className="chat__background" />
    <div className="chat__header">
      {page.isMobile && (
        <IconButton onClick={() => history.goBack()}>
          <ArrowBack />
        </IconButton>
      )}
      <div className="avatar__container">
        <Avatar src={room?.photoURL} />
      </div>
      <div className="chat__header--info">
        <h3 style={{ width: page.isMobile && page.width - 165 }}>
          {room?.name}
        </h3>
      </div>
      <div className="chat__header--right">
        <input onChange={showPreview} type="file" id="image" style={{ display: "none" }} accept="image/*" />
        <IconButton>
          <label style={{ cursor: "pointer", height: 24 }} htmlFor="image">
            <AddPhotoAlternate />
          </label>
        </IconButton>
        <IconButton onClick={(event) => setOpenMenu(event.currentTarget)}>
          <MoreVert />
        </IconButton>
        <Menu
          anchorEl={openMenu}
          id="menu"
          open={Boolean(openMenu)}
          onClose={() => setOpenMenu(null)}
          keepMounted
        >
          <MenuItem onClick={deleteRoom}>
            Delete Room
          </MenuItem>
        </Menu>
      </div>
    </div>
    <div className="chat__body--container">
      <div className="chat__body" style={{ height: page.height - 68 }}>
        <ChatMessages messages={messages || []} user={user} roomId={roomId}
          audioId={audioId}
          setAudioId={setAudioId}
        />
      </div>
    </div>
    <MediaPreview src={src} closePreview={closePreview} />
    <ChatFooter
      input={input}
      onChange={onChange}
      sendMessage={sendMessage}
      room={room}
      user={user}
      roomId={roomId}
      image={image}
      audioId={audioId}
      setAudioId={setAudioId}
    />
    {isDeleting && <div className='chat__deleting'>
      <CircularProgress />
    </div>}
  </div>;
}
