"use client";
import { useEffect, useRef } from "react";
import styled from "styled-components";

const TARGET_W = 800;
const TARGET_H = 480;

const Outer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: black;
  overflow: hidden;
`;

const Inner = styled.div`
  width: ${TARGET_W}px;
  height: ${TARGET_H}px;
  transform-origin: center center;
  flex-shrink: 0;
`;

export const ScaleWrapper = ({ children }: { children: React.ReactNode }) => {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (!innerRef.current) return;
      const scale = Math.min(
        window.innerWidth / TARGET_W,
        window.innerHeight / TARGET_H
      ) * 2;
      innerRef.current.style.transform = `scale(${scale})`;
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <Outer>
      <Inner ref={innerRef}>{children}</Inner>
    </Outer>
  );
};
