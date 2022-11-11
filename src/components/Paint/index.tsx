import { KonvaEventObject } from "konva/lib/Node";
import React, { ComponentProps, useEffect, useMemo, useState } from "react";
import {
  Ellipse,
  Image,
  Layer,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import { v4 as uuidv4 } from "uuid";
import {
  getRGBFromPenColor,
  isPaintEllipse,
  isPaintRect,
  isPaintText,
} from "./func";

export type CanvasDrawMode =
  | "SELECT"
  | "RECT"
  | "ELLIPSE"
  | "TEXT_S"
  | "TEXT_L";
export type PenColor = "ORANGE" | "GREEN" | "PURPLE";

export type PaintRect = {
  type: "RECT";
  x: number;
  y: number;
  width: number;
  height: number;
  key: string;
  strokeColor: string;
  fillColor: string;
  readonly: boolean;
};

export type PaintEllipse = {
  type: "ELLIPSE";
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  key: string;
  strokeColor: string;
  fillColor: string;
  readonly: boolean;
};

export type PaintText = {
  type: "TEXT";
  x: number;
  y: number;
  width: number;
  key: string;
  color: string;
  fontSize: number;
  text: string;
  readonly: boolean;
};

export type PaintShape = PaintRect | PaintEllipse | PaintText;

export type Position = { x: number; y: number };
export type Size = { width: number; height: number };

const Paint = ({
  bgImg,
  drawMode = "SELECT",
  penColor = "ORANGE",
  shapes,
  readonly = false,
  onDrawEnd,
  onShapeMoveEnd,
  onShapeResizeEnd,
  onTextInput,
}: {
  bgImg?: HTMLImageElement;
  drawMode?: CanvasDrawMode;
  penColor?: PenColor;
  shapes: PaintShape[];
  readonly?: boolean;
  onDrawEnd?: (newItem?: PaintShape) => void;
  onShapeMoveEnd?: (index: number, pos: Position) => void;
  onShapeResizeEnd?: (index: number, size: Size) => void;
  onTextInput?: (index: number, char: string) => void;
}) => {
  const [selectedShape, setSelectedShape] = useState<{
    index: number;
    key: string;
  }>();
  const [drawTarget, setDrawTarget] = useState<PaintShape>();

  const handleCanvasMouseDown: ComponentProps<typeof Stage>["onMouseDown"] = (
    e
  ) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const clickedOnEmpty =
      e.target === e.target.getStage() || "image" in e.target.attrs;
    if (clickedOnEmpty) {
      setSelectedShape(undefined);
    }

    switch (drawMode) {
      case "RECT":
        const newRect: PaintRect = {
          type: "RECT",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          key: uuidv4(),
          strokeColor: getRGBFromPenColor(penColor),
          fillColor: getRGBFromPenColor(penColor, 0.3),
          readonly,
        };
        setDrawTarget(newRect);
        break;
      case "ELLIPSE":
        const newEllipse: PaintEllipse = {
          type: "ELLIPSE",
          x: pos.x,
          y: pos.y,
          radiusX: 0,
          radiusY: 0,
          key: uuidv4(),
          strokeColor: getRGBFromPenColor(penColor),
          fillColor: getRGBFromPenColor(penColor, 0.3),
          readonly,
        };
        setDrawTarget(newEllipse);
        break;
      case "TEXT_S":
      case "TEXT_L":
        const fontSize = drawMode === "TEXT_S" ? 16 : 32;
        const newText: PaintText = {
          type: "TEXT",
          x: pos.x,
          y: pos.y,
          width: 0,
          text: "TEXT",
          key: uuidv4(),
          fontSize,
          color: getRGBFromPenColor(penColor),
          readonly,
        };
        setDrawTarget(newText);
        break;
    }
  };

  const handleCanvasMouseMove: ComponentProps<typeof Stage>["onMouseMove"] = (
    e
  ) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    setDrawTarget((target) => {
      if (!target) return target;

      const newTarget = { ...target };
      if (isPaintRect(newTarget)) {
        newTarget.width = pos.x - target.x;
        newTarget.height = pos.y - target.y;
      } else if (isPaintEllipse(newTarget)) {
        newTarget.radiusX = Math.abs(pos.x - target.x);
        newTarget.radiusY = Math.abs(pos.y - target.y);
      } else if (isPaintText(newTarget)) {
        newTarget.width = pos.x - target.x;
      }

      return newTarget;
    });
  };

  const handleCanvasMouseUp: ComponentProps<typeof Stage>["onMouseUp"] = () => {
    setDrawTarget(undefined);
    onDrawEnd?.(drawTarget);
  };

  const handleSelect = (index: number, key: string) => {
    setSelectedShape({ key, index });
  };

  useEffect(() => {
    if (!selectedShape) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        setSelectedShape(undefined);
        return;
      }

      onTextInput?.(selectedShape.index, e.key);
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [onTextInput, selectedShape]);

  return (
    <Stage
      width={1024}
      height={768}
      className="border-solid border-2 border-gray-300"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
    >
      {bgImg && (
        <Layer>
          <Image image={bgImg} />
        </Layer>
      )}
      <Layer>
        <Shape
          shape={drawTarget}
          border={drawTarget && isPaintText(drawTarget)}
        />
        <ShapeList
          shapes={shapes}
          selectedShape={selectedShape}
          onMoveEnd={onShapeMoveEnd}
          onResizeEnd={onShapeResizeEnd}
          onSelect={handleSelect}
        />
      </Layer>
    </Stage>
  );
};

const ShapeList = ({
  shapes,
  selectedShape,
  onMoveEnd,
  onResizeEnd,
  onSelect,
}: {
  shapes: PaintShape[];
  selectedShape?: { index: number; key: string };
  onMoveEnd?: (index: number, pos: Position) => void;
  onResizeEnd?: (index: number, size: Size) => void;
  onSelect?: (index: number, key: string) => void;
}) => {
  const handleMoveEnd = (index: number) => (pos: Position) => {
    onMoveEnd?.(index, pos);
  };

  const handleResizeEnd = (index: number) => (size: Size) => {
    onResizeEnd?.(index, size);
  };

  const handleSelect = (index: number, key: string) => () => {
    onSelect?.(index, key);
  };

  return (
    <>
      {shapes.map((shape, shapeIdx) => (
        <Shape
          key={shape.key}
          selected={selectedShape?.key === shape.key}
          shape={shape}
          onMoveEnd={handleMoveEnd(shapeIdx)}
          onResizeEnd={handleResizeEnd(shapeIdx)}
          onSelect={
            shape.readonly ? undefined : handleSelect(shapeIdx, shape.key)
          }
        />
      ))}
    </>
  );
};

const Shape = ({
  shape,
  selected,
  border,
  onSelect,
  onMoveEnd,
  onResizeEnd,
}: {
  shape?: PaintShape;
  selected?: boolean;
  border?: boolean;
  onSelect?: VoidFunction;
  onMoveEnd?: (pos: Position) => void;
  onResizeEnd?: (size: Size) => void;
}) => {
  const [node, setNode] = useState<any>();
  const trRef: ComponentProps<typeof Transformer>["ref"] = React.useRef(null);

  const shapeComp = useMemo(() => {
    if (!shape) return null;

    const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
      onMoveEnd?.({ x: e.target.x(), y: e.target.y() });
    };

    const handleTransformEnd = (e: KonvaEventObject<DragEvent>) => {
      const node = e.target;

      const [scaleX, scaleY, nodeWidth, nodeHeight] = [
        node.scaleX(),
        node.scaleY(),
        node.width(),
        node.height(),
      ];
      node.scaleX(1);
      node.scaleY(1);
      const [width, height] = [scaleX * nodeWidth, scaleY * nodeHeight];

      onResizeEnd?.({ width, height });
    };
    if (isPaintRect(shape)) {
      return (
        <Rect
          draggable={selected}
          ref={(node) => {
            setNode(node);
          }}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.fillColor}
          stroke={shape.strokeColor}
          strokeWidth={1}
          onClick={onSelect}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        />
      );
    } else if (isPaintEllipse(shape)) {
      return (
        <Ellipse
          draggable={selected}
          ref={(node) => {
            setNode(node);
          }}
          x={shape.x}
          y={shape.y}
          radiusX={shape.radiusX}
          radiusY={shape.radiusY}
          fill={shape.fillColor}
          stroke={shape.strokeColor}
          strokeWidth={1}
          onClick={onSelect}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        />
      );
    } else if (isPaintText(shape)) {
      return (
        <Text
          draggable={selected}
          ref={(node) => {
            setNode(node);
          }}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          color={shape.color}
          text={shape.text}
          fontSize={shape.fontSize}
          onClick={onSelect}
          onDragEnd={handleDragEnd}
          onTransform={handleTransformEnd}
        />
      );
    }

    return null;
  }, [onMoveEnd, onResizeEnd, onSelect, shape, selected]);

  useEffect(() => {
    if (!trRef.current || !node || !selected) return;

    trRef.current.nodes([node]);
    trRef.current.getLayer()?.batchDraw();

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      trRef.current?.detach();
    };
  }, [node, selected]);

  return (
    <>
      {shapeComp}
      <Transformer
        ref={trRef}
        enabledAnchors={
          shape && isPaintText(shape)
            ? ["middle-left", "middle-right"]
            : undefined
        }
        rotateEnabled={false}
      />
      {border && shape && isPaintText(shape) && (
        <Rect
          {...shape}
          height={shape.fontSize}
          stroke="black"
          strokeWidth={1}
        />
      )}
    </>
  );
};

export default Paint;
