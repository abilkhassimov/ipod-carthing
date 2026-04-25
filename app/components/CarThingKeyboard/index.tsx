"use client";
import { useCallback } from "react";
import { useEventListener } from "@/hooks";
import { dispatchKeyboardEvent } from "@/utils/events";

/**
 * Invisible keyboard handler for CarThing physical buttons.
 * Listens for keydown events and dispatches iPod navigation events.
 * No visual output — CarThing's physical buttons map to keyboard keys.
 */
export const CarThingKeyboard = () => {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => dispatchKeyboardEvent(event.key),
    []
  );

  useEventListener("keydown", handleKeyPress);

  return null;
};
