import { Audio } from "expo-av";
import { createContext, useContext, useEffect, useRef } from "react";

const MUSIC_FILES = {
  Prelude: require("../../assets/music/prelude.mp3"),
  EternalWind: require("../../assets/music/EternalWind.mp3"),
  Battle: require("../../assets/music/Battle.mp3"),
  Victory: require("../../assets/music/Victory.mp3"),
  EndingTheme: require("../../assets/music/EndingTheme.mp3"),
};

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const soundRef = useRef(null);
  const currentTrackName = useRef(null);
  const transitionQueueRef = useRef(Promise.resolve());
  const requestIdRef = useRef(0);

  const enqueueTransition = (work) => {
    transitionQueueRef.current = transitionQueueRef.current
      .then(work)
      .catch((error) => {
        console.error("Music transition error:", error);
      });

    return transitionQueueRef.current;
  };

  const unloadSoundSafe = async (sound) => {
    if (!sound) return;

    try {
      await sound.stopAsync();
    } catch (_) {
      // Ignoramos errores de stop en sonidos ya detenidos.
    }

    try {
      await sound.unloadAsync();
    } catch (_) {
      // Ignoramos errores de unload en sonidos ya descargados.
    }
  };

  const playTrack = async (trackName) => {
    if (!MUSIC_FILES[trackName]) {
      console.warn(`Track ${trackName} not found.`);
      return;
    }

    const requestId = ++requestIdRef.current;

    return enqueueTransition(async () => {
      const activeSound = soundRef.current;

      if (currentTrackName.current === trackName && activeSound) {
        try {
          const status = await activeSound.getStatusAsync();
          if (status?.isLoaded && !status.isPlaying) {
            await activeSound.setIsLoopingAsync(true);
            await activeSound.playAsync();
          }
          return;
        } catch (_) {
          // Si no podemos reutilizar el sonido actual, recreamos la pista.
        }
      }

      soundRef.current = null;
      currentTrackName.current = null;
      await unloadSoundSafe(activeSound);

      const { sound } = await Audio.Sound.createAsync(MUSIC_FILES[trackName], {
        shouldPlay: false,
        isLooping: true,
      });

      // Si llegó una petición más reciente durante la carga, descartamos esta pista.
      if (requestId !== requestIdRef.current) {
        await unloadSoundSafe(sound);
        return;
      }

      await sound.playAsync();

      if (requestId !== requestIdRef.current) {
        await unloadSoundSafe(sound);
        return;
      }

      soundRef.current = sound;
      currentTrackName.current = trackName;
    });
  };

  const stopTrack = async () => {
    const requestId = ++requestIdRef.current;

    return enqueueTransition(async () => {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const activeSound = soundRef.current;
      soundRef.current = null;
      currentTrackName.current = null;
      await unloadSoundSafe(activeSound);
    });
  };

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(console.error);

    return () => {
      stopTrack();
    };
  }, []);

  return (
    <MusicContext.Provider value={{ playTrack, stopTrack }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);
