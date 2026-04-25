"use client";
import styled from "styled-components";
import {
  dispatchBackClickEvent,
  dispatchBackwardScrollEvent,
  dispatchCenterClickEvent,
  dispatchForwardClickEvent,
  dispatchForwardScrollEvent,
  dispatchMenuClickEvent,
  dispatchPlayPauseClickEvent,
} from "@/utils/events";

const Bar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 56px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 1000;
  user-select: none;
`;

const Btn = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  padding: 8px 16px;
  cursor: pointer;
  opacity: 0.85;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.5;
  }
`;

const SelectBtn = styled(Btn)`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  width: 42px;
  height: 42px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const TouchControls = () => (
  <Bar>
    <Btn onPointerDown={dispatchMenuClickEvent} title="Menu">☰</Btn>
    <Btn onPointerDown={dispatchBackClickEvent} title="Prev">⏮</Btn>
    <Btn onPointerDown={dispatchBackwardScrollEvent} title="Up">▲</Btn>
    <SelectBtn onPointerDown={dispatchCenterClickEvent} title="Select">●</SelectBtn>
    <Btn onPointerDown={dispatchForwardScrollEvent} title="Down">▼</Btn>
    <Btn onPointerDown={dispatchForwardClickEvent} title="Next">⏭</Btn>
    <Btn onPointerDown={dispatchPlayPauseClickEvent} title="Play/Pause">⏯</Btn>
  </Bar>
);
