import { PaintEllipse, PaintRect, PaintShape, PaintText, PenColor } from ".";

export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 768;

export function getRGBFromPenColor(penColor: PenColor, opacity = 1.0) {
  switch (penColor) {
    case "ORANGE":
      return `rgba(249,115,22,${opacity})`;
    case "GREEN":
      return `rgba(34,197,94,${opacity})`;
    case "PURPLE":
      return `rgba(168,85,247,${opacity})`;
  }
}

export function isPaintRect(shape: PaintShape): shape is PaintRect {
  return shape.type === "RECT";
}

export function isPaintEllipse(shape: PaintShape): shape is PaintEllipse {
  return shape.type === "ELLIPSE";
}

export function isPaintText(shape: PaintShape): shape is PaintText {
  return shape.type === "TEXT";
}
