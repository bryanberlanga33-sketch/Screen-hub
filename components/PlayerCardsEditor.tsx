"use client";

import { type ChangeEvent, useRef, useState } from "react";
import {
  DISPLAY_DEFINITIONS,
  MARCHING_ORDER_POSITIONS,
} from "@/data/defaultScenes";
import type {
  DisplayTarget,
  DisplaysState,
  MarchingOrderPosition,
  PlayerCard,
  PlayerCardsState,
} from "@/types/terrador";
import { ImageCropper } from "./ImageCropper";
import { readFileAsDataUrl } from "./imageUpload";
import { VisualAsset } from "./VisualAsset";

interface PlayerCardsEditorProps {
  playerCards: PlayerCardsState;
  displays: DisplaysState;
  onSetTitle: (title: string) => void;
  onSetPosition: (position: MarchingOrderPosition) => void;
  onAddCard: () => void;
  onUpdateCard: (cardId: string, patch: Partial<Omit<PlayerCard, "id">>) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, direction: 1 | -1) => void;
  onToggleDisplay: (displayId: DisplayTarget) => void;
}

interface PlayerCardRowProps {
  card: PlayerCard;
  index: number;
  total: number;
  onUpdate: (patch: Partial<Omit<PlayerCard, "id">>) => void;
  onDelete: () => void;
  onMove: (direction: 1 | -1) => void;
}

function PlayerCardRow({
  card,
  index,
  total,
  onUpdate,
  onDelete,
  onMove,
}: PlayerCardRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const source = await readFileAsDataUrl(file);
      setCropSource(source);
    } catch {
      setUploadError("Could not read that player card image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <article className="grid gap-4 rounded-2xl border border-cyan-100/14 bg-slate-950/58 p-4 lg:grid-cols-[9rem_1fr_auto] lg:items-start">
        <div className="grid gap-2">
          <VisualAsset
            name={card.name}
            imagePath={card.image}
            className="aspect-[5/7] rounded-xl border border-cyan-100/15"
            compact
          />
          <p className="text-center text-[0.65rem] uppercase tracking-[0.14em] text-cyan-200/70">
            5:7 vertical crop
          </p>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <label className="grid gap-1 text-sm text-cyan-100">
              Card name
              <input
                className="steel-input"
                value={card.name}
                onChange={(event) => onUpdate({ name: event.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm text-cyan-100">
              Image path
              <input
                className="steel-input"
                value={card.image}
                onChange={(event) => onUpdate({ image: event.target.value })}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              className="steel-button quiet-button py-2 text-xs"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Loading..." : "Upload & Crop Vertical Card"}
            </button>
            <button
              className={`steel-button py-2 text-xs ${card.visible ? "" : "quiet-button"}`}
              onClick={() => onUpdate({ visible: !card.visible })}
            >
              {card.visible ? "Shown in Tray" : "Hidden from Tray"}
            </button>
            {card.image ? (
              <button
                className="steel-button quiet-button py-2 text-xs"
                onClick={() => onUpdate({ image: "" })}
              >
                Clear Image
              </button>
            ) : null}
          </div>

          {uploadError ? (
            <p className="text-xs text-red-300">{uploadError}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            className="steel-button quiet-button py-2 text-xs"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            Move Up
          </button>
          <button
            className="steel-button quiet-button py-2 text-xs"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            Move Down
          </button>
          <button className="steel-button danger-button py-2 text-xs" onClick={onDelete}>
            Remove
          </button>
        </div>
      </article>

      {cropSource ? (
        <ImageCropper
          title={`Crop ${card.name} player card`}
          source={cropSource}
          outputWidth={500}
          outputHeight={700}
          aspectLabel="5:7 vertical player card"
          applyLabel="Use Cropped Player Card"
          onApply={(dataUrl) => {
            onUpdate({ image: dataUrl });
            setCropSource(null);
          }}
          onCancel={() => setCropSource(null)}
        />
      ) : null}
    </>
  );
}

export function PlayerCardsEditor({
  playerCards,
  displays,
  onSetTitle,
  onSetPosition,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
  onToggleDisplay,
}: PlayerCardsEditorProps) {
  const { title, cards, position } = playerCards;

  return (
    <section className="rune-panel rounded-3xl p-5">
      <div className="relative z-10 grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
              Player Card Showcase
            </p>
            <h2 className="text-2xl font-black">Vertical Player Cards</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Build a tray of tall card images and show them on any visual screen.
            </p>
          </div>
          <label className="grid gap-1 text-sm text-cyan-100">
            Tray title
            <input
              className="steel-input"
              value={title}
              maxLength={40}
              onChange={(event) => onSetTitle(event.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-4 rounded-2xl border border-cyan-100/14 bg-slate-950/50 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
              Show player cards on:
            </span>
            {DISPLAY_DEFINITIONS.map((display) => {
              const shown = displays[display.id]?.showPlayerCards ?? false;
              return (
                <button
                  key={display.id}
                  className={`steel-button py-2 text-xs ${shown ? "" : "quiet-button"}`}
                  onClick={() => onToggleDisplay(display.id)}
                >
                  {shown ? "On" : "Off"} · {display.label}
                </button>
              );
            })}
          </div>
          <button className="steel-button" onClick={onAddCard}>
            Add Player Card
          </button>
        </div>

        <div className="grid gap-3 rounded-2xl border border-cyan-100/14 bg-slate-950/50 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
              Tray Position
            </p>
            <p className="text-sm text-slate-300">
              Pick the screen section for the vertical card tray.
            </p>
          </div>
          <div
            className="grid w-full max-w-xs gap-1.5 sm:justify-self-end"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
            role="group"
            aria-label="Player card tray position"
          >
            {MARCHING_ORDER_POSITIONS.map((option) => {
              const active = position === option.value;
              return (
                <button
                  key={option.value}
                  className={`steel-button px-2 py-3 text-[0.65rem] leading-tight ${active ? "" : "quiet-button"}`}
                  aria-pressed={active}
                  title={option.label}
                  onClick={() => onSetPosition(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4">
          {cards.length === 0 ? (
            <p className="rounded-2xl border border-cyan-100/14 bg-slate-950/50 p-4 text-sm text-slate-300">
              No player cards yet. Add a card, then upload a tall image.
            </p>
          ) : (
            cards.map((card, index) => (
              <PlayerCardRow
                key={card.id}
                card={card}
                index={index}
                total={cards.length}
                onUpdate={(patch) => onUpdateCard(card.id, patch)}
                onDelete={() => onDeleteCard(card.id)}
                onMove={(direction) => onMoveCard(card.id, direction)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
