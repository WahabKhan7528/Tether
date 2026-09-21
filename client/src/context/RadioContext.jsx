import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import * as radyoApi from '../api/radyo';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const RadioContext = createContext();

export function RadioProvider({ children }) {
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(50);
  const [audioSrc, setAudioSrc] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);
  const playAfterLoadRef = useRef(false);
  const loadGenRef = useRef(0);

  const location = useLocation();
  const isPublicPage = ['/login', '/signup', '/onboarding'].includes(location.pathname);
  const prevIsPublicPage = useRef(isPublicPage);
  const { user } = useAuth();
  const socket = useSocket();
  const remoteAction = useRef(false);
  const initialLoadDone = useRef(false);

  const coupleIdStr = typeof user?.coupleId === 'object' ? user.coupleId._id : user?.coupleId;

  // Revoke old blob URL and set a new one
  const setBlobAudioSrc = useCallback((blobUrl) => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    blobUrlRef.current = blobUrl;
    setAudioSrc(blobUrl);
  }, []);

  const loadTrackBlob = useCallback(async (track, shouldPlay) => {
    if (!track?.url) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }
    setBlobAudioSrc(null);

    setIsLoading(true);
    setIsPlaying(false);
    playAfterLoadRef.current = shouldPlay;

    const gen = ++loadGenRef.current;

    try {
      // track.url is now 'radyo/stream/:id' (without a leading slash)
      // Since Axios baseURL is '/api/v1', api.get() will correctly resolve to
      // '/api/v1/radyo/stream/:id'.
      const response = await api.get(track.url, { responseType: 'blob' });
      if (gen !== loadGenRef.current) return;
      const blobUrl = URL.createObjectURL(response.data);
      setBlobAudioSrc(blobUrl);
    } catch (err) {
      if (gen !== loadGenRef.current) return;
      console.error('[Radyo] Failed to fetch audio blob:', err);
      setIsLoading(false);
      setIsPlaying(false);
      toast.error('Could not load audio. Please try again.');
    }
  }, [setBlobAudioSrc]);


  // Load tracks when couple changes
  useEffect(() => {
    const loadTracks = async () => {
      if (!coupleIdStr) {
        setTracks([]);
        setCurrentTrack(null);
        return;
      }
      try {
        const coupleTracks = await radyoApi.getTracks();
        setTracks(coupleTracks);
        const lastPlayedId = localStorage.getItem('lastPlayedTrackId');
        if (lastPlayedId) {
          const track = coupleTracks.find((t) => t._id === lastPlayedId);
          if (track) {
            setCurrentTrack(track);
          } else if (coupleTracks.length > 0) {
            setCurrentTrack(coupleTracks[0]);
          } else {
            setCurrentTrack(null);
          }
        } else if (coupleTracks.length > 0) {
          setCurrentTrack(coupleTracks[0]);
        } else {
          setCurrentTrack(null);
        }
      } catch (err) {
        console.error('Failed to load tracks', err);
      }
    };
    loadTracks();
  }, [coupleIdStr]);

  // Fetch blob when currentTrack changes
  useEffect(() => {
    if (!currentTrack?.url) {
      setBlobAudioSrc(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setProgress(0);
      return;
    }
    const shouldAutoPlay = initialLoadDone.current && !isPublicPage;
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
    }
    loadTrackBlob(currentTrack, shouldAutoPlay);
  }, [currentTrack]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle auth page transitions
  useEffect(() => {
    if (prevIsPublicPage.current && !isPublicPage) {
      if (audioRef.current && audioSrc && !isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    } else if (!prevIsPublicPage.current && isPublicPage) {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
    prevIsPublicPage.current = isPublicPage;
  }, [isPublicPage, audioSrc, isPlaying]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Socket sync
  useEffect(() => {
    if (!socket) return;
    const handlePlay = () => {
      remoteAction.current = true;
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    };
    const handlePause = () => {
      remoteAction.current = true;
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    const handleChangeTrack = (data) => {
      remoteAction.current = true;
      const track = tracks.find((t) => t._id === data.trackId);
      if (track) {
        setCurrentTrack(track);
        localStorage.setItem('lastPlayedTrackId', track._id);
      }
    };
    const handleSeek = (data) => {
      remoteAction.current = true;
      if (audioRef.current) {
        audioRef.current.currentTime = data.time;
        setCurrentTime(data.time);
        setProgress((data.time / audioRef.current.duration) * 100 || 0);
      }
    };
    socket.on('radyo_play', handlePlay);
    socket.on('radyo_pause', handlePause);
    socket.on('radyo_change_track', handleChangeTrack);
    socket.on('radyo_seek', handleSeek);
    return () => {
      socket.off('radyo_play', handlePlay);
      socket.off('radyo_pause', handlePause);
      socket.off('radyo_change_track', handleChangeTrack);
      socket.off('radyo_seek', handleSeek);
    };
  }, [socket, isPlaying, tracks]);

  // Cleanup blob URL on unmount; also invalidate any in-flight fetch.
  useEffect(() => {
    return () => {
      loadGenRef.current++; // invalidate any in-flight loadTrackBlob call
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  // Audio element event handlers
  const handleCanPlay = () => {
    setIsLoading(false);
    if (playAfterLoadRef.current && audioRef.current) {
      playAfterLoadRef.current = false;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('[Radyo] Autoplay blocked or failed:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleAudioError = (e) => {
    const err = e.currentTarget?.error;
    console.error('[Radyo] Audio element error:', err?.code, err?.message);
    setIsLoading(false);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isLoading) {
      toast('Loading tape\u2026', { icon: '\u{1F4FC}', duration: 1500 });
      return;
    }
    if (!audioSrc) {
      toast.error('Please upload a tape first!', { icon: '\u{1F4FC}' });
      return;
    }
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      if (socket) socket.emit('radyo_pause');
    } else {
      audioRef.current
        ?.play()
        .then(() => {
          setIsPlaying(true);
          if (socket) socket.emit('radyo_play');
        })
        .catch((err) => {
          console.error('[Radyo] Play failed:', err);
          if (currentTrack?.url) {
            // Audio element may be in error state — reload the blob and autoplay
            loadTrackBlob(currentTrack, true);
          } else {
            toast.error('Playback failed. Try again.');
          }
        });
    }
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t._id === currentTrack?._id);
    handleTrackSelect(tracks[(idx + 1) % tracks.length]);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t._id === currentTrack?._id);
    handleTrackSelect(tracks[(idx - 1 + tracks.length) % tracks.length]);
  };

  const handleTrackSelect = (track) => {
    setCurrentTrack(track);
    localStorage.setItem('lastPlayedTrackId', track._id);
    if (socket && !remoteAction.current) {
      socket.emit('radyo_change_track', { trackId: track._id });
    }
    remoteAction.current = false;
  };

  const addTrack = async (file) => {
    if (!user?.coupleId) {
      toast.error('You need to be in a couple to upload a tape.');
      return;
    }
    const toastId = toast.loading('Uploading tape...');
    try {
      const newTrack = await radyoApi.uploadTrack(file);
      setTracks((prev) => [...prev, newTrack]);
      handleTrackSelect(newTrack);
      toast.success(`Inserted Tape: ${file.name}`, { id: toastId, icon: '\u{1F4FC}' });
    } catch (err) {
      console.error('Failed to save track', err);
      toast.error('Failed to upload tape', { id: toastId });
    }
  };

  const removeTrack = async (trackId) => {
    try {
      await radyoApi.deleteTrack(trackId);
      setTracks((prev) => prev.filter((t) => t._id !== trackId));
      if (currentTrack?._id === trackId) {
        audioRef.current?.pause();
        setIsPlaying(false);
        setCurrentTrack(null);
        setBlobAudioSrc(null);
        localStorage.removeItem('lastPlayedTrackId');
      }
      toast.success('Track removed');
    } catch (err) {
      console.error('Failed to delete track', err);
      toast.error('Failed to delete track');
    }
  };

  const fastForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + 10,
        audioRef.current.duration || 0
      );
    }
  };

  const rewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(time);
      setProgress(dur > 0 ? (time / dur) * 100 : 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      setProgress((time / audioRef.current.duration) * 100 || 0);
      if (socket && !remoteAction.current) {
        socket.emit('radyo_seek', { time });
      }
      remoteAction.current = false;
    }
  };

  const value = {
    tracks,
    currentTrack,
    isPlaying,
    isLoading,
    volume,
    setVolume,
    togglePlay,
    nextTrack,
    prevTrack,
    addTrack,
    removeTrack,
    handleTrackSelect,
    fastForward,
    rewind,
    currentTime,
    duration,
    progress,
    seek,
  };

  return (
    <RadioContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        src={audioSrc || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onError={handleAudioError}
        onEnded={() => {
          setIsPlaying(false);
          nextTrack();
        }}
      />
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
}
