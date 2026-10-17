"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { CloseIcon, FlipIcon, GalleryIcon } from "@/components/icons";
import { BottomPanel, IconButton, TopBar } from "@/components/ScreenLayout";
import type { ColorCount } from "@/lib/aura/generate";
import { captureVideoFrame, loadPhotoFile } from "@/lib/image";

type Facing = "user" | "environment";
type CameraState = "starting" | "live" | "unavailable";

interface CameraScreenProps {
  colors: ColorCount;
  onColorsChange: (count: ColorCount) => void;
  onClose: () => void;
  onCapture: (photo: HTMLCanvasElement) => void;
  onPickPhoto: () => void;
}

export function CameraScreen({ colors, onColorsChange, onClose, onCapture, onPickPhoto }: CameraScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const nativeCaptureRef = useRef<HTMLInputElement>(null);
  const [facing, setFacing] = useState<Facing>("user");
  const [state, setState] = useState<CameraState>("starting");
  const [flashing, setFlashing] = useState(false);
  const mirror = facing === "user";

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) return;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play().catch(() => {});
        if (!cancelled) setState("live");
      } catch {
        if (!cancelled) setState("unavailable");
      }
    };
    start();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [facing]);

  const capture = () => {
    const video = videoRef.current;
    if (state !== "live" || !video?.videoWidth) return;
    const photo = captureVideoFrame(video, mirror);
    setFlashing(true);
    setTimeout(() => onCapture(photo), 220);
  };

  const flip = () => {
    setState("starting");
    setFacing((f) => (f === "user" ? "environment" : "user"));
  };

  const onNativeCapture = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onCapture(await loadPhotoFile(file));
  };

  return (
    <div className="absolute inset-0 flex animate-fade-in flex-col bg-black">
      <TopBar>
        <IconButton label="Close" onClick={onClose}>
          <CloseIcon size={22} />
        </IconButton>
        <div
          role="radiogroup"
          aria-label="Number of colors"
          className="flex rounded-full border border-white/25 p-0.5 text-[9px] italic tracking-[0.2em]"
        >
          {([2, 3] as const).map((count) => (
            <button
              key={count}
              type="button"
              role="radio"
              aria-checked={colors === count}
              onClick={() => onColorsChange(count)}
              className={`rounded-full px-3 py-1.5 transition ${
                colors === count ? "bg-white text-black" : "text-white/70 hover:text-white"
              }`}
            >
              {count} COLORS
            </button>
          ))}
        </div>
        <span className="size-7" />
      </TopBar>

      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-neutral-950">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 h-full w-full object-cover grayscale-[35%] transition-opacity duration-500 ${
            mirror ? "-scale-x-100" : ""
          } ${state === "live" ? "opacity-100" : "opacity-0"}`}
        />

        {state === "live" && <Viewfinder />}

        {state === "starting" && (
          <p className="absolute inset-0 grid place-items-center text-[10px] font-light italic tracking-[0.3em] text-white/50">
            STARTING CAMERA…
          </p>
        )}

        {state === "unavailable" && (
          <div className="absolute inset-0 flex animate-fade-in flex-col items-center justify-center gap-6 px-10 text-center">
            <p className="relative text-[12px] font-light leading-relaxed text-white/70">
              We can&apos;t reach your camera here. Allow camera access, or take the photo with your
              phone&apos;s camera instead.
            </p>
            <button
              type="button"
              onClick={() => nativeCaptureRef.current?.click()}
              className="relative h-12 rounded-full border border-white/50 bg-white/[0.06] px-7 text-[10px] italic tracking-[0.26em] backdrop-blur-md transition active:scale-[0.98]"
            >
              OPEN CAMERA
            </button>
          </div>
        )}

        {flashing && <div className="absolute inset-0 animate-flash bg-white" />}
      </div>

      <BottomPanel>
        <div className="flex w-full items-center justify-between px-12">
          <IconButton label="Choose from gallery" onClick={onPickPhoto} className="m-0 size-12">
            <GalleryIcon size={24} />
          </IconButton>
          <button
            type="button"
            aria-label="Take photo"
            onClick={capture}
            disabled={state !== "live"}
            className="grid size-[74px] place-items-center rounded-full border border-white/70 transition active:scale-95 disabled:opacity-35"
          >
            <span className="size-[60px] rounded-full bg-white/90 transition group-active:bg-white" />
          </button>
          <IconButton
            label="Flip camera"
            onClick={flip}
            disabled={state === "unavailable"}
            className="m-0 size-12 disabled:opacity-30"
          >
            <FlipIcon size={24} />
          </IconButton>
        </div>
      </BottomPanel>

      <input
        ref={nativeCaptureRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={onNativeCapture}
      />
    </div>
  );
}

/** Corner marks only: the aura covers the whole frame, so you can stand anywhere in it. */
function Viewfinder() {
  const corner = "absolute size-7 border-white/70";
  return (
    <div className="pointer-events-none absolute inset-[6%]">
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
      <p className="absolute inset-x-0 bottom-[4%] text-center text-[10px] font-light italic tracking-[0.26em] text-white/80">
        HOLD STILL, THEN TAP
      </p>
    </div>
  );
}
