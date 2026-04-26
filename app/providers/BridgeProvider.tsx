"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type BridgeTrack = {
  persistentId: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  position?: number;
};

type BridgeState = {
  connected: boolean;
  track: BridgeTrack | null;
  artwork: string | null;
  state: "playing" | "paused" | "stopped";
  position: number;
  library: BridgeTrack[];
  artworkCache: Map<string, string | null>;
  send: (msg: object) => void;
  requestArtwork: (artist: string, album: string) => void;
};

const BridgeContext = createContext<BridgeState | null>(null);

const BRIDGE_URL_KEY = "carthing_bridge_url";
const DEFAULT_URL = "ws://localhost:8765";

export const BridgeProvider = ({ children }: { children: React.ReactNode }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [track, setTrack] = useState<BridgeTrack | null>(null);
  const [artwork, setArtwork] = useState<string | null>(null);
  const [state, setState] = useState<"playing" | "paused" | "stopped">("stopped");
  const [position, setPosition] = useState(0);
  const [library, setLibrary] = useState<BridgeTrack[]>([]);
  const [artworkCache] = useState(() => new Map<string, string | null>());

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const requestArtwork = useCallback((artist: string, album: string) => {
    const key = `${artist}__${album}`;
    if (!artworkCache.has(key)) {
      send({ type: "get_artwork", artist, album });
    }
  }, [send, artworkCache]);

  useEffect(() => {
    const url = typeof window !== "undefined"
      ? (localStorage.getItem(BRIDGE_URL_KEY) ?? DEFAULT_URL)
      : DEFAULT_URL;

    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          console.log("[bridge] Connected to", url);
        };

        ws.onclose = () => {
          setConnected(false);
          console.log("[bridge] Disconnected. Reconnecting in 3s...");
          reconnectTimer = setTimeout(connect, 3000);
        };

        ws.onerror = () => ws.close();

        ws.onmessage = (event) => {
          let msg: { type: string; [key: string]: unknown };
          try { msg = JSON.parse(event.data); } catch { return; }

          switch (msg.type) {
            case "now_playing":
              setTrack(msg.track as BridgeTrack);
              setArtwork((msg.artwork as string) ?? null);
              if (msg.artwork) {
                const t = msg.track as BridgeTrack;
                artworkCache.set(`${t.artist}__${t.album}`, msg.artwork as string);
              }
              break;
            case "state":
              setState(msg.state as "playing" | "paused" | "stopped");
              break;
            case "position":
              setPosition(msg.position as number);
              break;
            case "library":
              setLibrary(msg.tracks as BridgeTrack[]);
              break;
            case "artwork": {
              const key = `${msg.artist}__${msg.album}`;
              artworkCache.set(key, (msg.url as string) ?? null);
              break;
            }
          }
        };
      } catch (e) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [artworkCache]);

  return (
    <BridgeContext.Provider
      value={{ connected, track, artwork, state, position, library, artworkCache, send, requestArtwork }}
    >
      {children}
    </BridgeContext.Provider>
  );
};

export const useBridge = () => {
  const ctx = useContext(BridgeContext);
  if (!ctx) throw new Error("useBridge must be used within BridgeProvider");
  return ctx;
};
