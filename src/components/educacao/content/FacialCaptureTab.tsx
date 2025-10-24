import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface FacialPhoto {
  angle: string;
  angleLabel: string;
  blob: Blob | null;
  preview: string | null;
}

interface FacialCaptureTabProps {
  onPhotosCapture: (photos: FacialPhoto[]) => void;
  consent: boolean;
  onConsentChange: (consent: boolean) => void;
}

export function FacialCaptureTab({ onPhotosCapture, consent, onConsentChange }: FacialCaptureTabProps) {
  const [photos, setPhotos] = useState<FacialPhoto[]>([
    { angle: "frontal", angleLabel: "Frontal", blob: null, preview: null },
    { angle: "left_45", angleLabel: "Perfil Esquerdo (45°)", blob: null, preview: null },
    { angle: "right_45", angleLabel: "Perfil Direito (45°)", blob: null, preview: null },
    { angle: "up", angleLabel: "Olhando para Cima", blob: null, preview: null },
    { angle: "down", angleLabel: "Olhando para Baixo", blob: null, preview: null },
  ]);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeAngleIndex, setActiveAngleIndex] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async (angleIndex: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
        setActiveAngleIndex(angleIndex);
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setActiveAngleIndex(null);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || activeAngleIndex === null) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const preview = URL.createObjectURL(blob);
        const newPhotos = [...photos];
        newPhotos[activeAngleIndex] = {
          ...newPhotos[activeAngleIndex],
          blob,
          preview,
        };
        setPhotos(newPhotos);
        onPhotosCapture(newPhotos);
        toast.success(`Foto ${newPhotos[activeAngleIndex].angleLabel} capturada!`);
        stopCamera();
      }
    }, "image/jpeg", 0.95);
  }, [activeAngleIndex, photos, onPhotosCapture, stopCamera]);

  const recapturePhoto = useCallback((index: number) => {
    const newPhotos = [...photos];
    if (newPhotos[index].preview) {
      URL.revokeObjectURL(newPhotos[index].preview!);
    }
    newPhotos[index] = {
      ...newPhotos[index],
      blob: null,
      preview: null,
    };
    setPhotos(newPhotos);
    onPhotosCapture(newPhotos);
  }, [photos, onPhotosCapture]);

  const allPhotosCaptured = photos.every(p => p.blob !== null);
  const capturedCount = photos.filter(p => p.blob !== null).length;

  return (
    <div className="space-y-6 max-h-[50vh] overflow-y-auto">
      {/* Consentimento LGPD */}
      <div className="border border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Autorização para Reconhecimento Facial
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), solicitamos sua autorização 
              para capturar e armazenar imagens faciais do aluno para fins de controle de presença 
              e segurança escolar. As imagens serão armazenadas de forma segura e utilizadas 
              exclusivamente para identificação do aluno ao entrar na escola.
            </p>
            <div className="flex items-start gap-2">
              <Checkbox 
                id="facial-consent" 
                checked={consent}
                onCheckedChange={(checked) => onConsentChange(checked as boolean)}
              />
              <Label htmlFor="facial-consent" className="text-sm font-medium cursor-pointer">
                Autorizo a captura e uso de reconhecimento facial para controle de presença
              </Label>
            </div>
          </div>
        </div>
      </div>

      {!consent && (
        <div className="text-center text-muted-foreground py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>É necessário autorizar o uso de reconhecimento facial antes de prosseguir</p>
        </div>
      )}

      {consent && (
        <>
          {/* Progresso */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso do Cadastro Facial</span>
              <span className="text-sm text-muted-foreground">{capturedCount}/5 fotos</span>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(capturedCount / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Visualização da câmera */}
          {isCapturing && (
            <div className="bg-black rounded-lg overflow-hidden">
              <div className="relative">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  className="w-full h-auto"
                />
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Capturando
                </div>
                {activeAngleIndex !== null && (
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <div className="inline-block bg-black/70 text-white px-4 py-2 rounded-lg">
                      <p className="text-sm font-medium">{photos[activeAngleIndex].angleLabel}</p>
                      <p className="text-xs opacity-80 mt-1">Posicione o rosto conforme indicado</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 flex gap-3 justify-center">
                <Button onClick={stopCamera} variant="outline">
                  Cancelar
                </Button>
                <Button onClick={capturePhoto} className="gap-2">
                  <Camera className="h-4 w-4" />
                  Capturar Foto
                </Button>
              </div>
            </div>
          )}

          {/* Canvas oculto para captura */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Grid de fotos */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.angle} className="space-y-2">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border relative">
                  {photo.preview ? (
                    <>
                      <img 
                        src={photo.preview} 
                        alt={photo.angleLabel}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">{photo.angleLabel}</p>
                  {photo.blob ? (
                    <Button 
                      onClick={() => recapturePhoto(index)} 
                      variant="outline" 
                      size="sm"
                      className="w-full gap-2"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Recapturar
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => startCamera(index)} 
                      size="sm"
                      className="w-full gap-2"
                      disabled={isCapturing}
                    >
                      <Camera className="h-3 w-3" />
                      Capturar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Status final */}
          {allPhotosCaptured && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-500 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    Cadastro Facial Completo!
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Todas as 5 fotos foram capturadas com sucesso. O aluno está pronto para usar o reconhecimento facial.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
