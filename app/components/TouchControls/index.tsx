"use client";
import styled from "styled-components";
import {
  dispatchBackwardScrollEvent,
  dispatchCenterClickEvent,
  dispatchForwardScrollEvent,
  dispatchMenuClickEvent,
} from "@/utils/events";

const Panel = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 160px;
  height: 480px;
  background: #1c1c1e;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  z-index: 1000;
  user-select: none;
  border-left: 1px solid #333;
`;

const Btn = styled.button`
  flex: 1;
  background: none;
  border: none;
  border-bottom: 1px solid #2c2c2e;
  color: #f2f2f7;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 500;
  letter-spacing: 0.3px;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const Icon = styled.span`
  font-size: 22px;
  line-height: 1;
`;

const Label = styled.span`
  font-size: 11px;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const TouchControls = () => (
  <Panel>
    <Btn onPointerDown={dispatchMenuClickEvent}>
      <Icon>☰</Icon>
      <Label>Меню</Label>
    </Btn>
    <Btn onPointerDown={dispatchBackwardScrollEvent}>
      <Icon>▲</Icon>
      <Label>Вверх</Label>
    </Btn>
    <Btn onPointerDown={dispatchCenterClickEvent}>
      <Icon>●</Icon>
      <Label>Выбор</Label>
    </Btn>
    <Btn onPointerDown={dispatchForwardScrollEvent}>
      <Icon>▼</Icon>
      <Label>Вниз</Label>
    </Btn>
  </Panel>
);
