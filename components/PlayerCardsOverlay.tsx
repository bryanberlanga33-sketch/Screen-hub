"use client";

import type { PlayerCardsState } from "@/types/terrador";
import { VisualAsset } from "./VisualAsset";

interface PlayerCardsOverlayProps {
  playerCards: PlayerCardsState;
}

export function PlayerCardsOverlay({ playerCards }: PlayerCardsOverlayProps) {
  const visibleCards = playerCards.cards.filter((card) => card.visible);

  if (visibleCards.length === 0) {
    return null;
  }

  return (
    <aside className={`player-card-tray player-card-pos-${playerCards.position}`}>
      <p className="player-card-tray-title">{playerCards.title || "Player Cards"}</p>
      <ol className="player-card-list">
        {visibleCards.map((card) => (
          <li key={card.id} className="player-card-item">
            <VisualAsset
              name={card.name}
              imagePath={card.image}
              className="aspect-[5/7] w-full rounded-[1rem] border border-cyan-100/20"
              imageClassName="object-cover"
              placeholderClassName="rounded-[1rem]"
              compact
            />
            <p className="player-card-name">{card.name}</p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
