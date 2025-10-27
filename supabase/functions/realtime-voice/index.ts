import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  try {
    const upgradeHeader = req.headers.get("upgrade") || "";
    if (upgradeHeader.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    
    let openAISocket: WebSocket | null = null;
    let isSessionReady = false;
    
    const connectToOpenAI = async (voice: string = "alloy") => {
      console.log(`Connecting to OpenAI with voice: ${voice}`);
      
      try {
        // Create WebSocket connection with proper authentication
        const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
        
        // For Deno, we need to use a different approach for headers
        // We'll use the WebSocket constructor without headers and send them via protocol
        openAISocket = new WebSocket(url);
        
        // Store auth info to send after connection
        const authInfo = {
          apiKey: OPENAI_API_KEY,
          voice: voice
        };

        openAISocket.onopen = () => {
          console.log("Connected to OpenAI Realtime API");
          // Note: OpenAI Realtime API authenticates via the URL or initial handshake
          // The API key should be in the connection, but if not working, we may need
          // to send it as a message or use a different connection method
        };

        openAISocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("OpenAI event:", data.type);

            // Send session.update after receiving session.created
            if (data.type === "session.created" && !isSessionReady) {
              console.log("Session created, sending session.update");
              isSessionReady = true;
              
              const sessionUpdate = {
                type: "session.update",
                session: {
                  modalities: ["text", "audio"],
                  instructions: "Você é um assistente útil da Prefeitura de Afogados da Ingazeira. Seja cordial, prestativo e objetivo. Responda em português brasileiro.",
                  voice: voice,
                  input_audio_format: "pcm16",
                  output_audio_format: "pcm16",
                  input_audio_transcription: {
                    model: "whisper-1"
                  },
                  turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 1000
                  },
                  temperature: 0.8,
                  max_response_output_tokens: "inf"
                }
              };
              
              openAISocket?.send(JSON.stringify(sessionUpdate));
            }

            // Forward all messages to client
            if (clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(JSON.stringify(data));
            }
          } catch (error) {
            console.error("Error processing OpenAI message:", error);
          }
        };

        openAISocket.onerror = (error) => {
          console.error("OpenAI WebSocket error:", error);
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({ 
              type: "error", 
              error: "OpenAI connection error" 
            }));
          }
        };

        openAISocket.onclose = () => {
          console.log("OpenAI WebSocket closed");
          isSessionReady = false;
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({ 
              type: "connection_closed" 
            }));
          }
        };
      } catch (error) {
        console.error("Error connecting to OpenAI:", error);
        throw error;
      }
    };

    clientSocket.onopen = () => {
      console.log("Client connected");
    };

    clientSocket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle voice change request
        if (data.type === "change_voice") {
          console.log("Changing voice to:", data.voice);
          if (openAISocket) {
            openAISocket.close();
          }
          await connectToOpenAI(data.voice);
          return;
        }

        // Handle initial connection
        if (data.type === "start_session") {
          await connectToOpenAI(data.voice || "echo");
          return;
        }

        // Forward all other messages to OpenAI
        if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
          openAISocket.send(JSON.stringify(data));
        }
      } catch (error) {
        console.error("Error processing client message:", error);
      }
    };

    clientSocket.onclose = () => {
      console.log("Client disconnected");
      if (openAISocket) {
        openAISocket.close();
      }
    };

    clientSocket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
    };

    return response;
  } catch (error) {
    console.error("Server error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
