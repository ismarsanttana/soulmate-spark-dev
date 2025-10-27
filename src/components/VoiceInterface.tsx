import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceInterfaceProps {
  onClose: () => void;
}

const SAVED_PROMPT_ID = "pmpt_68feb9e72ed88197b31c41ed47c4d224001ca760f75b6d43";

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [status, setStatus] = useState("pronto");
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const getMedia = async () => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone",
        variant: "destructive",
      });
      throw error;
    }
  };

  const fetchEphemeralKey = async () => {
    try {
      setStatus("obtendo token...");
      const { data, error } = await supabase.functions.invoke('realtime-token', {
        body: {}
      });

      if (error) throw error;
      
      const key = data?.client_secret?.value;
      if (!key) throw new Error("Token inválido");
      
      return key;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      throw error;
    }
  };

  const negotiateSDP = async (ephemeralKey: string, offerSDP: string, model = "gpt-4o-realtime-preview-2024-12-17") => {
    try {
      setStatus("negociando conexão...");
      
      // Tenta primeiro o endpoint GA
      let resp = await fetch(`https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(model)}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        },
        body: offerSDP
      });

      if (!resp.ok) {
        // Fallback para endpoint anterior
        resp = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp"
          },
          body: offerSDP
        });
      }

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Falha no SDP: ${errorText}`);
      }

      return await resp.text();
    } catch (error) {
      console.error('Erro na negociação SDP:', error);
      throw error;
    }
  };

  const applySavedPrompt = () => {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    
    const msg = {
      type: "session.update",
      session: {
        prompt: { id: SAVED_PROMPT_ID },
        voice: "shimmer",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        input_audio_format: "pcm16",
        output_audio_format: "pcm16"
      }
    };
    
    dcRef.current.send(JSON.stringify(msg));
    console.log("[realtime] Prompt salvo aplicado (session.update)");
    setStatus("prompt configurado");
  };

  const startConnection = async () => {
    try {
      setStatus("conectando...");
      
      // Obter token efêmero
      const ephemeralKey = await fetchEphemeralKey();
      
      // Obter mídia local
      const stream = await getMedia();
      localStreamRef.current = stream;
      
      // Criar peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      
      // Configurar áudio remoto
      pc.ontrack = (e) => {
        console.log("[realtime] Track recebido");
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0];
          setStatus("ouvindo...");
        }
      };
      
      // Adicionar track local
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      // Configurar data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      
      dc.onopen = () => {
        console.log("[realtime] DataChannel aberto");
        applySavedPrompt();
      };
      
      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log("[realtime] Evento:", event.type);
          
          if (event.type === 'session.updated') {
            setStatus("pronto para falar");
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      };
      
      // Criar e enviar offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Obter answer da OpenAI
      const answerSDP = await negotiateSDP(ephemeralKey, offer.sdp!);
      
      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: answerSDP,
      };
      
      await pc.setRemoteDescription(answer);
      console.log("[realtime] Conexão WebRTC estabelecida");
      
      toast({
        title: "Conectado!",
        description: "Você já pode começar a falar com o assistente.",
      });
      
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setStatus("erro na conexão");
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao conectar",
        variant: "destructive",
      });
      stopConnection();
    }
  };

  const stopConnection = () => {
    console.log("[realtime] Finalizando conexão");
    
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    setIsConnected(false);
    setIsMuted(false);
    setStatus("desconectado");
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      setStatus(audioTrack.enabled ? "ouvindo..." : "mutado");
    }
  };

  const unmute = () => {
    if (!localStreamRef.current) return;
    
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = true;
      setIsMuted(false);
      setStatus("ouvindo...");
    }
  };

  useEffect(() => {
    return () => {
      stopConnection();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-destructive/20 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 p-8 max-w-2xl w-full">
        <header className="text-center">
          <h1 className="text-3xl font-bold mb-2">Assistente de Conversação</h1>
          <p className="text-muted-foreground">
            {isConnected ? "Fale naturalmente com o assistente" : "Clique em Iniciar para começar"}
          </p>
        </header>

        {/* Card com controles */}
        <div className="w-full bg-card border border-border rounded-2xl p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex gap-2 flex-wrap">
              {!isConnected ? (
                <Button onClick={startConnection} size="lg">
                  Iniciar
                </Button>
              ) : (
                <>
                  <Button onClick={stopConnection} variant="secondary" size="lg">
                    Finalizar
                  </Button>
                  {isMuted ? (
                    <Button onClick={unmute} variant="outline" size="lg">
                      <MicOff className="w-4 h-4 mr-2" />
                      Ativar mic
                    </Button>
                  ) : (
                    <Button onClick={toggleMute} variant="outline" size="lg">
                      <Mic className="w-4 h-4 mr-2" />
                      Mutar
                    </Button>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className="text-sm font-medium">{status}</span>
            </div>
          </div>

          {/* Áudio remoto (hidden) */}
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
        </div>

        <footer className="text-center text-sm text-muted-foreground">
          OpenAI Realtime + Supabase Edge Functions
        </footer>
      </div>
    </div>
  );
};

export default VoiceInterface;
