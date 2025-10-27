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
    // Auto-connect quando o componente monta
    console.log("[realtime] Auto-conectando...");
    startConnection();

    return () => {
      stopConnection();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black z-50 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all z-10"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Central Orb */}
      <div className="relative flex items-center justify-center">
        {/* Animated rings quando está gravando ou falando */}
        {(status === "ouvindo..." || status === "pronto para falar") && (
          <>
            <div className="absolute w-64 h-64 rounded-full border-2 border-blue-500/30 animate-ping" />
            <div className="absolute w-80 h-80 rounded-full border border-blue-400/20 animate-pulse" />
            {status === "ouvindo..." && !isMuted && (
              <>
                <div className="absolute w-56 h-56 rounded-full border-2 border-blue-400/40 animate-ping animation-delay-150" />
                <div className="absolute w-72 h-72 rounded-full border border-blue-300/30 animate-pulse animation-delay-300" />
              </>
            )}
          </>
        )}
        
        {/* Main orb */}
        <div className={`relative w-48 h-48 rounded-full transition-all duration-300 ${
          status === "ouvindo..." && !isMuted
            ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_80px_rgba(59,130,246,0.8)] animate-pulse' 
            : status === "pronto para falar"
            ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_60px_rgba(6,182,212,0.6)] animate-pulse'
            : isMuted
            ? 'bg-gradient-to-br from-gray-500/50 to-gray-600/50 shadow-[0_0_40px_rgba(107,114,128,0.3)]'
            : 'bg-gradient-to-br from-blue-500/50 to-cyan-500/50 shadow-[0_0_40px_rgba(59,130,246,0.3)]'
        }`}>
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
          
          {/* Pulsing effect when speaking */}
          {status === "pronto para falar" && (
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-400' : 'bg-yellow-400'
          } ${isConnected && 'animate-pulse'}`} />
          <span className="text-sm text-white font-medium">
            {status === "conectando..." ? 'Conectando...' : 
             status === "ouvindo..." ? (isMuted ? 'Mutado' : 'Escutando...') : 
             status === "pronto para falar" ? 'Pronto' : 
             status === "obtendo token..." ? 'Iniciando...' :
             status === "negociando conexão..." ? 'Conectando...' :
             status === "prompt configurado" ? 'Configurando...' :
             'Conectando...'}
          </span>
        </div>
      </div>

      {/* Bottom controls - apenas quando conectado */}
      {isConnected && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4">
          <button
            onClick={stopConnection}
            className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all backdrop-blur-sm border border-white/20"
          >
            Finalizar
          </button>
          {isMuted ? (
            <button
              onClick={unmute}
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all backdrop-blur-sm border border-white/20 flex items-center gap-2"
            >
              <MicOff className="w-4 h-4" />
              Ativar mic
            </button>
          ) : (
            <button
              onClick={toggleMute}
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all backdrop-blur-sm border border-white/20 flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Mutar
            </button>
          )}
        </div>
      )}

      {/* Áudio remoto (hidden) */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
    </div>
  );
};

export default VoiceInterface;
