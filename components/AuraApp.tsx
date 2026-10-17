"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ColorChoiceSheet } from "@/components/ColorChoiceSheet";
import { AuraRevealScreen } from "@/components/screens/AuraRevealScreen";
import { CameraScreen } from "@/components/screens/CameraScreen";
import { IntroScreen } from "@/components/screens/IntroScreen";
import { generateAura, type Aura, type ColorCount } from "@/lib/aura/generate";
import { formatAuraDate } from "@/lib/format";
import { loadPhotoFile, photoSeed } from "@/lib/image";

type View =
  | { name: "intro" }
  | { name: "camera" }
  | { name: "reveal"; photo: HTMLCanvasElement; aura: Aura; date: string };

export function AuraApp() {
  const [view, setView] = useState<View>({ name: "intro" });
  const [colors, setColors] = useState<ColorCount>(2);
  /** Which intro button opened the colour question; null while it is closed. */
  const [choosingFor, setChoosingFor] = useState<"camera" | "gallery" | null>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const showAura = (photo: HTMLCanvasElement) => {
    setView({
      name: "reveal",
      photo,
      aura: generateAura(photoSeed(photo), colors),
      date: formatAuraDate(new Date()),
    });
  };

  const pickPhoto = () => galleryInput.current?.click();

  const chooseColors = (count: ColorCount) => {
    setColors(count);
    setChoosingFor(null);
    // Opening the picker has to happen inside this tap, or the browser blocks it.
    if (choosingFor === "gallery") pickPhoto();
    else setView({ name: "camera" });
  };

  const onGalleryFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) showAura(await loadPhotoFile(file));
  };

  return (
    <main className="relative h-full w-full select-none overflow-hidden bg-black text-white">
      {view.name === "intro" && (
        <IntroScreen onStart={() => setChoosingFor("camera")} onPickPhoto={() => setChoosingFor("gallery")} />
      )}
      {view.name === "camera" && (
        <CameraScreen
          colors={colors}
          onColorsChange={setColors}
          onClose={() => setView({ name: "intro" })}
          onCapture={showAura}
          onPickPhoto={pickPhoto}
        />
      )}
      {view.name === "reveal" && (
        <AuraRevealScreen
          photo={view.photo}
          aura={view.aura}
          date={view.date}
          onClose={() => setView({ name: "intro" })}
          onRetake={() => setView({ name: "camera" })}
        />
      )}
      <ColorChoiceSheet open={choosingFor !== null} onChoose={chooseColors} onClose={() => setChoosingFor(null)} />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onGalleryFile}
      />
    </main>
  );
}
