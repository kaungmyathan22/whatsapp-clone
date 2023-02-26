import { CircularProgress } from '@material-ui/core';
import { PauseRounded, PlayArrowRounded } from '@material-ui/icons';
import React, { useEffect, useRef, useState } from "react";
import "./AudioPlayer.css";

export default function AudioPlayer ({ setAudioId, audioId, sender, audioUrl, id }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [duration, setDuration] = useState("");

  const totalDuration = useRef("");
  const audio = useRef(new Audio(audioUrl));
  const interval = useRef();
  const isUploading = useRef(audioUrl === "uploading");

  useEffect(() => {
    if (isUploading.current && audioUrl !== "uploading") {
      audio.current = new Audio(audioUrl);
      audio.current.load();
      setIsLoaded(true);
    } else if (isUploading.current === false) {
      setIsLoaded(true);
    }
  }, [audioUrl]);

  function getAudioDuration (media) {
    return new Promise(resolve => {
      media.onloadedmetadata = () => {
        media.currentTime = Number.MAX_SAFE_INTEGER;
        media.ontimeupdate = () => {
          media.ontimeupdate = () => { }
          media.currentTime = 0.1;
          resolve(media.duration);
        }
      }
    })
  }

  useEffect(() => {
    if (isLoaded) {
      getAudioDuration(audio.current).then(() => {
        setIsMetadataLoaded(true);
      });
    }
  }, [isLoaded]);

  useEffect(() => {
    if (isMetadataLoaded) {
      audio.current.addEventListener("canplaythrough", () => {
        if (!totalDuration.current) {
          setIsMediaLoaded(true);
          const time = formatTime(audio.current.duration);
          totalDuration.current = time;
          setDuration(time);
        }
      });
      audio.current.addEventListener("ended", () => {
        clearInterval(interval.current);
        setDuration(totalDuration.current);
        setSliderValue(0);
        setIsPlaying(false);
      })
    }
  }, [isMetadataLoaded]);

  function formatTime (time) {
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time - minutes * 60);
    if (minutes < 10) {
      minutes = `0${minutes}`
    }
    if (seconds < 10) {
      seconds = `0${seconds}`
    }
    return `${minutes}:${seconds}`
  }

  function playAudio () {
    setIsPlaying(true);
    audio.current.play();
    if (audioId !== id) {
      setAudioId(id);
    }
    interval.current = setInterval(updateSldier, 100);
  }

  function updateSldier () {
    let sliderPosition = 0;
    const { currentTime, duration } = audio.current;
    if (typeof duration === "number") {
      sliderPosition = currentTime * (100 / duration);
      setSliderValue(sliderPosition);
      const time = formatTime(currentTime);
      setDuration(time);
    }
  }

  function stopAudio () {
    audio.current.pause();
    clearInterval(interval.current);
    setIsPlaying(false);
  }

  function scrubAudio (event) {
    const value = event.target.value;
    const { duration } = audio.current;
    if (isMediaLoaded) {
      const seekTo = duration * (value / 100);
      audio.current.currentTime = seekTo;
      setSliderValue(value);
    }
  }

  useEffect(() => {
    if (audioId !== id) {
      audio.current.pause();
      setIsPlaying(false);
    }
  }, [audioId, id]);


  return <>
    <div className={`audioplayer ${sender ? "" : "audioplayer__alt"}`}>
      {!isMediaLoaded ? (
        <CircularProgress />
      ) : isPlaying ? (
        <PauseRounded onClick={stopAudio} className="pause" />
      ) : !isPlaying ? (
        <PlayArrowRounded onClick={playAudio} />
      ) : null}

      <div>
        <span className='audioplayer__slider--played' style={{ width: `${sliderValue}%` }}>
        </span>
        <input onChange={scrubAudio} type="range" min="1" max="100" value={sliderValue} className="audioplayer__slider" />
      </div>
    </div>
    <span className="chat__timestamp audioplayer__time">
      {duration}
    </span>
  </>;
}
