import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Mic, X, Settings } from "lucide-react";
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from "@/utils/RealtimeAudio";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface VoiceInterfaceProps {
  onClose: () => void;
}

const AVAILABLE_VOICES = [
  { id: "shimmer", name: "Shimmer ⭐", description: "Voz feminina natural e suave (Recomendado)" },
  { id: "nova", name: "Nova ⭐", description: "Voz feminina expressiva e natural (Recomendado)" },
  { id: "alloy", name: "Alloy", description: "Voz neutra e equilibrada" },
  { id: "echo", name: "Echo", description: "Voz masculina clara" },
  { id: "ash", name: "Ash", description: "Voz masculina profunda" },
  { id: "ballad", name: "Ballad", description: "Voz masculina calorosa" },
  { id: "coral", name: "Coral", description: "Voz feminina clara" },
  { id: "sage", name: "Sage", description: "Voz neutra calma" },
  { id: "verse", name: "Verse", description: "Voz masculina confiante" },
];

export const VoiceInterface = ({ onClose }: VoiceInterfaceProps) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("nova"); // Voz expressiva e animada por padrão
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const autoConnectRef = useRef(false);

  const connectWebSocket = () => {
    try {
      const wsUrl = `wss://hqhjbelcouanvcrqudbj.supabase.co/functions/v1/realtime-voice`;
      
      console.log("Connecting to:", wsUrl);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        
        // Start session with selected voice
        wsRef.current?.send(JSON.stringify({
          type: "start_session",
          voice: selectedVoice
        }));

        toast({
          title: "Conectado",
          description: "Assistente de voz pronto",
        });
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received event:", data.type);

          switch (data.type) {
            case "session.created":
              console.log("Session created");
              break;

            case "session.updated":
              console.log("Session updated - ready to talk");
              break;

            case "input_audio_buffer.speech_started":
              console.log("Speech started");
              setIsRecording(true);
              setIsSpeaking(false);
              break;

            case "input_audio_buffer.speech_stopped":
              console.log("Speech stopped");
              setIsRecording(false);
              break;

            case "response.audio.delta":
              if (data.delta) {
                const binaryString = atob(data.delta);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }

                if (!audioContextRef.current) {
                  audioContextRef.current = new AudioContext({ sampleRate: 24000 });
                  audioQueueRef.current = new AudioQueue(audioContextRef.current);
                }

                await audioQueueRef.current?.addToQueue(bytes);
                setIsSpeaking(true);
                setIsRecording(false);
              }
              break;

            case "response.audio.done":
              console.log("Audio response done");
              setIsSpeaking(false);
              break;

            case "response.done":
              console.log("Response complete");
              break;

            case "error":
              console.error("Error from server:", data.error);
              toast({
                title: "Erro",
                description: typeof data.error === 'string' ? data.error : (data.error?.message || 'Erro desconhecido'),
                variant: "destructive",
              });
              break;

            case "connection_closed":
              handleReconnect();
              break;
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Erro de Conexão",
          description: "Não foi possível conectar ao servidor",
          variant: "destructive",
        });
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket closed");
        setIsConnected(false);
        setIsRecording(false);
        setIsSpeaking(false);
      };

    } catch (error) {
      console.error("Error connecting:", error);
      toast({
        title: "Erro",
        description: "Falha ao conectar",
        variant: "destructive",
      });
    }
  };

  const handleReconnect = () => {
    console.log("Attempting to reconnect...");
    setTimeout(() => {
      connectWebSocket();
      startRecording();
    }, 2000);
  };

  const startRecording = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        audioQueueRef.current = new AudioQueue(audioContextRef.current);
      }

      recorderRef.current = new AudioRecorder((audioData) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const encoded = encodeAudioForAPI(audioData);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encoded
          }));
        }
      });

      await recorderRef.current.start();
      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Erro no Microfone",
        description: "Não foi possível acessar o microfone",
        variant: "destructive",
      });
    }
  };

  const disconnect = () => {
    recorderRef.current?.stop();
    wsRef.current?.close();
    audioQueueRef.current?.clear();
    setIsConnected(false);
    setIsRecording(false);
    setIsSpeaking(false);
  };

  const handleClose = () => {
    disconnect();
    onClose();
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("Changing voice to:", voiceId);
      
      // Disconnect current session and reconnect with new voice
      disconnect();
      
      // Small delay to ensure clean disconnect
      setTimeout(() => {
        connectWebSocket();
        startRecording();
        
        toast({
          title: "Voz alterada",
          description: AVAILABLE_VOICES.find(v => v.id === voiceId)?.name,
        });
      }, 500);
    } else {
      toast({
        title: "Voz selecionada",
        description: `${AVAILABLE_VOICES.find(v => v.id === voiceId)?.name} será usada na próxima conexão`,
      });
    }
    
    setIsSettingsOpen(false);
  };

  // Auto-connect on mount
  useEffect(() => {
    if (!autoConnectRef.current) {
      autoConnectRef.current = true;
      connectWebSocket();
      startRecording();
    }

    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black z-50 flex items-center justify-center">
      {/* Top buttons */}
      <div className="absolute top-8 right-8 flex items-center gap-3 z-10">
        {/* Settings button */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <button
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <Settings className="w-6 h-6 text-white" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Configurações de Voz</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {AVAILABLE_VOICES.map((voice) => (
                <Button
                  key={voice.id}
                  onClick={() => handleVoiceChange(voice.id)}
                  variant={selectedVoice === voice.id ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto py-3"
                >
                  <div>
                    <div className="font-medium">{voice.name}</div>
                    <div className="text-sm opacity-70">{voice.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Central Orb */}
      <div className="relative flex items-center justify-center">
        {/* Animated rings */}
        {(isRecording || isSpeaking) && (
          <>
            <div className="absolute w-64 h-64 rounded-full border-2 border-blue-500/30 animate-ping" />
            <div className="absolute w-80 h-80 rounded-full border border-blue-400/20 animate-pulse" />
            {isRecording && (
              <>
                <div className="absolute w-56 h-56 rounded-full border-2 border-blue-400/40 animate-ping animation-delay-150" />
                <div className="absolute w-72 h-72 rounded-full border border-blue-300/30 animate-pulse animation-delay-300" />
              </>
            )}
          </>
        )}
        
        {/* Main orb */}
        <div className={`relative w-48 h-48 rounded-full transition-all duration-300 ${
          isRecording 
            ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_80px_rgba(59,130,246,0.8)] animate-pulse' 
            : isSpeaking
            ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_60px_rgba(6,182,212,0.6)] animate-pulse'
            : 'bg-gradient-to-br from-blue-500/50 to-cyan-500/50 shadow-[0_0_40px_rgba(59,130,246,0.3)]'
        }`}>
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
          
          {/* Pulsing effect when speaking */}
          {isSpeaking && (
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          )}
        </div>
      </div>

      {/* Bottom controls - only microphone button if not connected */}
      {!isConnected && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <button
            onClick={() => {
              connectWebSocket();
              startRecording();
            }}
            className="w-16 h-16 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-all shadow-lg"
          >
            <Mic className="w-7 h-7 text-gray-900" />
          </button>
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-400' : 'bg-gray-400'
          } ${isConnected && 'animate-pulse'}`} />
          <span className="text-sm text-white font-medium">
            {!isConnected ? 'Conectando...' : isRecording ? 'Escutando...' : isSpeaking ? 'Falando...' : 'Pronto'}
          </span>
        </div>
      </div>
    </div>
  );
};
