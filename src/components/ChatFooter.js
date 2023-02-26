import { CancelRounded, CheckCircleRounded, MicRounded, Send } from '@material-ui/icons';
import React, { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import db, { audioStorage, serverTimestamp } from '../firebase';
import "./ChatFooter.css";
import recordAudio from './recordAudio';

export default function ChatFooter ({ input, onChange, sendMessage, image, user, room, roomId, setAudioId, audioId }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState("00:00");

  const inputRef = useRef();
  const timerInterval = useRef();
  const record = useRef();
  const recordingEl = useRef();

  const btnIcons = (
    <>
      <Send style={{ width: 20, height: 20, color: "white" }} />
      <MicRounded style={{ width: 20, height: 20, color: "white" }} />
    </>
  )

  async function startRecording (e) {
    e.preventDefault();
    record.current = await recordAudio();
    inputRef.current.focus();
    inputRef.current.style.width = "calc(100% - 56px)";
    setIsRecording(true);
    setAudioId("");
  }

  function stopRecording () {
    inputRef.current.focus();
    clearInterval(timerInterval.current);
    const audio = record.current.stop();
    recordingEl.current.style.opacity = "0";
    setIsRecording(false);
    inputRef.current.style.width = "calc(100% - 112px)";
    setDuration("00:00");
    return audio;
  }

  async function finishRecording () {
    const audio = await stopRecording();
    const { audioFile, audioName } = await audio;
    sendAudio({ audioFile, audioName });
  }

  async function sendAudio ({ audioFile, audioName }) {
    db.collection("users").doc(user.uid).collection("chats").doc(roomId).set({
      name: room.name,
      photoURL: room.photoURL,
      timestamp: serverTimestamp()
    });
    const doc = await db.collection("rooms").doc(roomId).collection("messages").add({
      name: user.displayName,
      uid: user.uid,
      timestamp: serverTimestamp(),
      time: new Date().toUTCString(),
      audioUrl: "uploading",
      audioName,
    });

    await audioStorage.child(audioName).put(audioFile);
    const url = await audioStorage.child(audioName).getDownloadURL();
    db.collection("rooms").doc(roomId).collection("messages").doc(doc.id).update({ audioUrl: url });
  }
  function pad (value) {
    return String(value).length < 2 ? `0${value}` : value;
  }

  function audioInputChange (event) {
    const audioFile = event.target.files[0];
    if (audioFile) {
      setAudioId("");
      sendAudio({ audioFile, audioName: uuid() })
    }
  }

  useEffect(() => {
    if (isRecording) {
      function startTimer () {
        const start = Date.now();
        timerInterval.current = setInterval(setTime, 100);
        function setTime () {
          const timeElapsed = Date.now() - start;
          const totalSeconds = Math.floor(timeElapsed / 1000);
          const minutes = pad(parseInt(totalSeconds / 60));
          const seconds = pad(parseInt(totalSeconds % 60));
          const duration = `${minutes}:${seconds}`;
          setDuration(duration);
        }
      }
      recordingEl.current.style.opacity = "1";
      startTimer();
      record.current.start();
    }
  }, [isRecording]);


  const canRecord = navigator.mediaDevices.getUserMedia && window.MediaRecorder;

  return (
    <div className="chat__footer">
      <form>
        <input
          ref={inputRef}
          value={input}
          onChange={!isRecording ? onChange : null}
          onKeyPress={isRecording ? () => false : null}
          placeholder="Type a message"
        />

        {canRecord ? (
          <button
            onClick={input.trim() || (input === "" && image) ? sendMessage : startRecording}
            type="submit"
            className="send__btn"
          >
            {btnIcons}
          </button>
        ) : (
          <>
            <label htmlFor="capture" className="send__btn">
              {btnIcons}
            </label>
            <input
              style={{ display: "none" }}
              type="file"
              id="capture"
              accept="audio/*"
              capture
              onChange={audioInputChange}
            />
          </>
        )}
      </form>

      {isRecording && (
        <div
          ref={recordingEl}
          className="record">
          <CancelRounded
            style={{
              width: 30,
              height: 30,
              color: "#f20519",
            }}
            onClick={stopRecording}
          />
          <div>
            <div className="record__redcircle" />
            <div className="record__duration">{duration}</div>
          </div>
          <CheckCircleRounded
            style={{
              width: 30,
              height: 30,
              color: "#41bf49",
            }}
            onClick={finishRecording}
          />
        </div>
      )}
    </div>
  );
}