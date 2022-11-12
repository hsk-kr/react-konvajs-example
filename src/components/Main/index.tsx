import { ChangeEventHandler, useCallback, useRef, useState } from "react";
import Konva from "konva";

import ColorButton from "../ColorButton";
import Button from "../Button";
import Paint, {
  CanvasDrawMode,
  PaintShape,
  PenColor,
  Position,
  Size,
} from "../Paint";
import Checkbox from "../Checkbox";
import { isPaintEllipse, isPaintRect, isPaintText } from "../Paint/func";

const Main = () => {
  const [readonly, setReadonly] = useState(false);
  const [drawMode, setDrawMode] = useState<CanvasDrawMode>("SELECT");
  const [penColor, setPenColor] = useState<PenColor>("ORANGE");
  const [shapes, setShapes] = useState<PaintShape[]>([]);
  const [bgImg, setBgImg] = useState<HTMLImageElement>();
  const fileEl = useRef<HTMLInputElement>(null);
  const textAreaEl = useRef<HTMLTextAreaElement>(null);
  const stageEl = useRef<Konva.Stage>(null);
  const [bgImgRotation, setBgImgRotation] = useState(0);

  const handleDrawModeChange = (drawMode: CanvasDrawMode) => () => {
    setDrawMode(drawMode);
  };

  const handleCanvasDrawEnd = useCallback((newShape?: PaintShape) => {
    setDrawMode("SELECT");
    if (newShape) setShapes((prevShapes) => prevShapes.concat(newShape));
  }, []);

  const handleShapeMoveEnd = useCallback((index: number, pos: Position) => {
    setShapes((prevShapes) => {
      const newShapes = [...prevShapes];

      newShapes[index].x = pos.x;
      newShapes[index].y = pos.y;

      return newShapes;
    });
  }, []);

  const handleShapeResizeEnd = useCallback((index: number, size: Size) => {
    setShapes((prevShapes) => {
      const newShapes = [...prevShapes];

      const targetShape = newShapes[index];

      if (isPaintRect(targetShape)) {
        targetShape.width = size.width;
        targetShape.height = size.height;
      } else if (isPaintEllipse(targetShape)) {
        targetShape.radiusX = Math.floor(size.width / 2);
        targetShape.radiusY = Math.floor(size.height / 2);
      } else if (isPaintText(targetShape)) {
        targetShape.width = size.width;
      }

      return newShapes;
    });
  }, []);

  const handleUploadImageClick = () => {
    fileEl.current?.click();
  };

  const handleTextInput = useCallback((index: number, char: string) => {
    setShapes((prevShapes) => {
      const newShapes = [...prevShapes];

      const target = newShapes[index];
      if (isPaintText(target)) {
        if (char === "Backspace") {
          target.text = target.text.substring(0, target.text.length - 1);
        } else {
          target.text += char;
        }
      }

      return newShapes;
    });
  }, []);

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!e.target.files || e.target.files.length <= 0) {
      return;
    }

    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const image = new window.Image();
      image.src = (reader.result as string) || "";
      image.addEventListener("load", () => {
        setBgImg(image);
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePenColorChange = (penColor: PenColor) => () => {
    setPenColor(penColor);
  };

  const handleReadonlyChange = () => {
    setReadonly((prevReadOnly) => !prevReadOnly);
  };

  const rotateBackgroundImage = () => {
    setBgImgRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  const downloadCanvasAsImage = () => {
    if (!stageEl.current) return;
    const a = document.createElement("a");
    a.href = stageEl.current.toDataURL({
      quality: 0.8,
    });
    a.download = "canvas.jpeg";
    a.click();
    a.remove();
  };

  const handleJSONExport = () => {
    if (!textAreaEl.current) return;

    textAreaEl.current.value = JSON.stringify({
      bgImgSrc: bgImg?.src,
      bgImgRotation,
      shapes,
    });
  };

  const handleJSONImport = () => {
    if (!textAreaEl.current) return;

    try {
      const data: {
        bgImgSrc?: string;
        bgImgRotation: number;
        shapes: PaintShape[];
      } = JSON.parse(textAreaEl.current.value);

      if (data.bgImgSrc) {
        const image = new window.Image();
        image.src = data.bgImgSrc;
        image.addEventListener("load", () => {
          setBgImg(image);
        });
      }

      setBgImgRotation(data.bgImgRotation);
      setShapes(data.shapes);
    } catch {
      alert("Falied to import JSON");
    }
  };

  return (
    <div className="w-screen mx-auto mt-8 items-center justify-center flex flex-col gap-y-6">
      <Paint
        ref={stageEl}
        bgImg={bgImg}
        shapes={shapes}
        drawMode={drawMode}
        penColor={penColor}
        readonly={readonly}
        bgImgRotation={bgImgRotation}
        onDrawEnd={handleCanvasDrawEnd}
        onShapeMoveEnd={handleShapeMoveEnd}
        onShapeResizeEnd={handleShapeResizeEnd}
        onTextInput={handleTextInput}
      />
      <div className="flex justify-between items-center w-1024">
        <div className="flex flex-col gap-y-2">
          <div className="flex gap-x-2">
            <Button onClick={handleUploadImageClick}>Upload Image</Button>
            <Button onClick={downloadCanvasAsImage}>Download Canvas</Button>
            <input
              type="file"
              className="hidden"
              ref={fileEl}
              onChange={handleFileChange}
            />
          </div>
          <div className="flex gap-x-2">
            <Button onClick={handleJSONImport}>Import JSON</Button>
            <Button onClick={handleJSONExport}>Export as JSON</Button>
          </div>
        </div>
        <div className="flex flex-col gap-y-2 self-start">
          <div className="flex gap-x-2">
            <Button onClick={handleDrawModeChange("RECT")}>Rect</Button>
            <Button onClick={handleDrawModeChange("ELLIPSE")}>Ellipse</Button>
            <Button onClick={handleDrawModeChange("TEXT_S")}>Text(S)</Button>
            <Button onClick={handleDrawModeChange("TEXT_L")}>Text(L)</Button>
          </div>
          <div className="flex gap-x-2">
            <ColorButton
              color="ORANGE"
              onClick={handlePenColorChange("ORANGE")}
              selected={penColor === "ORANGE"}
            />
            <ColorButton
              color="GREEN"
              onClick={handlePenColorChange("GREEN")}
              selected={penColor === "GREEN"}
            />
            <ColorButton
              color="PURPLE"
              onClick={handlePenColorChange("PURPLE")}
              selected={penColor === "PURPLE"}
            />
            <Button onClick={rotateBackgroundImage}>Rotate</Button>
            <div className="flex items-end">
              <span className="mr-2">Readonly:</span>
              <Checkbox checked={readonly} onChange={handleReadonlyChange} />
            </div>
          </div>
        </div>
      </div>
      <div className="w-1024">
        <textarea
          ref={textAreaEl}
          className="w-full h-16 border border-gray-500 resize-none"
        />
      </div>
    </div>
  );
};

export default Main;
