import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from "@/utils/RealtimeAudio";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VoiceInterfaceProps {
  onClose: () => void;
}

export const VoiceInterface = ({ onClose }: VoiceInterfaceProps) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Desconectado");

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);

  const voices = [
    { value: "alloy", label: "Alloy (Neutro)", gender: "neutral" },
    { value: "echo", label: "Echo (Masculino)", gender: "male" },
    { value: "fable", label: "Fable (Masculino)", gender: "male" },
    { value: "onyx", label: "Onyx (Masculino)", gender: "male" },
    { value: "nova", label: "Nova (Feminino)", gender: "female" },
    { value: "shimmer", label: "Shimmer (Feminino)", gender: "female" },
  ];

  const connectWebSocket = () => {
    try {
      const projectRef = window.location.hostname.split('.')[0];
      const wsUrl = `wss://${projectRef}.supabase.co/functions/v1/realtime-voice`;
      
      console.log("Connecting to:", wsUrl);
      setStatus("Conectando...");

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setStatus("Conectado");
        
        // Start session with selected voice
        wsRef.current?.send(JSON.stringify({
          type: "start_session",
          voice: selectedVoice
        }));

        toast({
          title: "Conectado",
          description: "Assistente de voz pronto para uso",
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
              console.log("Session updated");
              setStatus("Pronto para falar");
              break;

            case "input_audio_buffer.speech_started":
              console.log("Speech started");
              setIsRecording(true);
              setStatus("Escutando...");
              break;

            case "input_audio_buffer.speech_stopped":
              console.log("Speech stopped");
              setIsRecording(false);
              setStatus("Processando...");
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
              }
              break;

            case "response.audio_transcript.delta":
              if (data.delta) {
                setTranscript(prev => prev + data.delta);
              }
              break;

            case "response.audio.done":
              console.log("Audio response done");
              setIsSpeaking(false);
              setStatus("Pronto para falar");
              break;

            case "response.done":
              console.log("Response complete");
              setStatus("Pronto para falar");
              break;

            case "error":
              console.error("Error from server:", data.error);
              toast({
                title: "Erro",
                description: data.error,
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
        setStatus("Erro de conexão");
        toast({
          title: "Erro de Conexão",
          description: "Não foi possível conectar ao servidor",
          variant: "destructive",
        });
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket closed");
        setIsConnected(false);
        setStatus("Desconectado");
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
    setStatus("Reconectando...");
    setTimeout(() => {
      connectWebSocket();
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
    setTranscript("");
    setStatus("Desconectado");
  };

  const handleVoiceChange = (voice: string) => {
    setSelectedVoice(voice);
    if (isConnected && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "change_voice",
        voice: voice
      }));
      toast({
        title: "Voz Alterada",
        description: `Voz mudada para ${voices.find(v => v.value === voice)?.label}`,
      });
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Assistente de Voz</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Selecione a Voz
            </label>
            <Select value={selectedVoice} onValueChange={handleVoiceChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.value} value={voice.value}>
                    {voice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm font-medium">{status}</span>
            </div>
          </div>

          {!isConnected ? (
            <Button
              onClick={() => {
                connectWebSocket();
                startRecording();
              }}
              className="w-full h-14 text-lg"
              size="lg"
            >
              <Mic className="w-5 h-5 mr-2" />
              Iniciar Conversa
            </Button>
          ) : (
            <Button
              onClick={disconnect}
              variant="destructive"
              className="w-full h-14 text-lg"
              size="lg"
            >
              <MicOff className="w-5 h-5 mr-2" />
              Encerrar Conversa
            </Button>
          )}

          {isConnected && (
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                }`}>
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-medium">
                  {isRecording ? 'Falando' : 'Aguardando'}
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                }`}>
                  <Volume2 className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-medium">
                  {isSpeaking ? 'Respondendo' : 'Silêncio'}
                </span>
              </div>
            </div>
          )}

          {transcript && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Transcrição:</p>
              <p className="text-sm opacity-80">{transcript}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
