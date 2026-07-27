"use client";

import * as React from "react";

type FrameFinish = "raspberry" | "grape" | "aqua" | "lime";

const frameColours: Record<FrameFinish, [string, string, string]> = {
  raspberry: ["#ffadc0", "#e84d72", "#9f214d"],
  grape: ["#d8c1ff", "#9b6be8", "#5c319f"],
  aqua: ["#b9f2f4", "#54bfd0", "#237b91"],
  lime: ["#e1f7a7", "#a9db42", "#5f8d19"],
};

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, safeRadius);
}

export function GummyFrameStudio() {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [finish, setFinish] = React.useState<FrameFinish>("raspberry");
  const [canvasColour, setCanvasColour] = React.useState("#fff6e9");
  const [padding, setPadding] = React.useState(72);
  const [radius, setRadius] = React.useState(28);
  const [status, setStatus] = React.useState("Choose a PNG, JPEG, or WebP image to begin.");

  React.useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function chooseImage(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.currentTarget.files?.[0] ?? null;
    if (!nextFile) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(nextFile.type)) {
      event.currentTarget.value = "";
      setFile(null);
      setPreviewUrl("");
      setStatus("That format is not supported. Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (nextFile.size > 20 * 1024 * 1024) {
      event.currentTarget.value = "";
      setFile(null);
      setPreviewUrl("");
      setStatus("Choose an image smaller than 20 MB so processing stays responsive.");
      return;
    }
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setStatus(`${nextFile.name} is ready. It remains on this device.`);
  }

  async function exportFrame() {
    if (!file) return;
    setStatus("Rendering the frame on this device…");
    try {
      const bitmap = await createImageBitmap(file);
      const frameWidth = 14;
      const desiredWidth = bitmap.width + (padding + frameWidth) * 2;
      const desiredHeight = bitmap.height + (padding + frameWidth) * 2;
      const scale = Math.min(1, 4096 / Math.max(desiredWidth, desiredHeight));
      const outputWidth = Math.max(1, Math.round(desiredWidth * scale));
      const outputHeight = Math.max(1, Math.round(desiredHeight * scale));
      const scaledPadding = padding * scale;
      const scaledFrame = frameWidth * scale;
      const imageWidth = bitmap.width * scale;
      const imageHeight = bitmap.height * scale;
      const imageX = scaledPadding + scaledFrame;
      const imageY = scaledPadding + scaledFrame;
      const scaledRadius = radius * scale;

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable.");

      context.fillStyle = canvasColour;
      context.fillRect(0, 0, outputWidth, outputHeight);

      const [light, core, depth] = frameColours[finish];
      const frameGradient = context.createLinearGradient(
        scaledPadding,
        scaledPadding,
        outputWidth - scaledPadding,
        outputHeight - scaledPadding,
      );
      frameGradient.addColorStop(0, light);
      frameGradient.addColorStop(0.48, core);
      frameGradient.addColorStop(1, depth);
      context.shadowColor = `${depth}66`;
      context.shadowBlur = 26 * scale;
      context.shadowOffsetY = 12 * scale;
      roundedRect(
        context,
        scaledPadding,
        scaledPadding,
        imageWidth + scaledFrame * 2,
        imageHeight + scaledFrame * 2,
        scaledRadius + scaledFrame,
      );
      context.fillStyle = frameGradient;
      context.fill();
      context.shadowColor = "transparent";

      context.save();
      roundedRect(context, imageX, imageY, imageWidth, imageHeight, scaledRadius);
      context.clip();
      context.drawImage(bitmap, imageX, imageY, imageWidth, imageHeight);
      context.restore();

      const highlight = context.createLinearGradient(imageX, imageY, imageX, imageY + 30 * scale);
      highlight.addColorStop(0, "rgba(255,255,255,0.72)");
      highlight.addColorStop(1, "rgba(255,255,255,0)");
      context.strokeStyle = highlight;
      context.lineWidth = Math.max(1, 3 * scale);
      roundedRect(
        context,
        imageX - scaledFrame / 2,
        imageY - scaledFrame / 2,
        imageWidth + scaledFrame,
        imageHeight + scaledFrame,
        scaledRadius + scaledFrame / 2,
      );
      context.stroke();
      bitmap.close();

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error("PNG export failed.")), "image/png");
      });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${file.name.replace(/\.[^.]+$/, "")}-gummy-frame.png`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
      setStatus(`Exported ${outputWidth} × ${outputHeight} PNG locally.`);
    } catch {
      setStatus("The browser could not render this image. Try a smaller PNG, JPEG, or WebP file.");
    }
  }

  const previewStyle = {
    "--studio-canvas": canvasColour,
    "--studio-padding": `${Math.round(padding / 2)}px`,
    "--studio-radius": `${radius}px`,
    "--studio-frame-light": frameColours[finish][0],
    "--studio-frame-core": frameColours[finish][1],
    "--studio-frame-depth": frameColours[finish][2],
  } as React.CSSProperties;

  return (
    <div className="frame-studio">
      <aside className="frame-studio__controls" aria-label="Frame controls">
        <label className="frame-studio__file">
          <span>Local image</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImage} />
          <strong>{file?.name ?? "Choose image"}</strong>
        </label>

        <fieldset>
          <legend>Gel frame</legend>
          <div className="frame-studio__finishes">
            {(Object.keys(frameColours) as FrameFinish[]).map((candidate) => (
              <button
                key={candidate}
                type="button"
                aria-pressed={finish === candidate}
                onClick={() => setFinish(candidate)}
                style={{ "--finish-colour": frameColours[candidate][1] } as React.CSSProperties}
              >
                {candidate}
              </button>
            ))}
          </div>
        </fieldset>

        <label>
          <span>Canvas colour</span>
          <input type="color" value={canvasColour} onChange={(event) => setCanvasColour(event.currentTarget.value)} />
          <code>{canvasColour}</code>
        </label>
        <label>
          <span>Canvas padding</span>
          <input type="range" min="24" max="180" step="4" value={padding} onChange={(event) => setPadding(Number(event.currentTarget.value))} />
          <output>{padding}px</output>
        </label>
        <label>
          <span>Image corners</span>
          <input type="range" min="0" max="64" step="2" value={radius} onChange={(event) => setRadius(Number(event.currentTarget.value))} />
          <output>{radius}px</output>
        </label>

        <button className="frame-studio__export" type="button" disabled={!file} onClick={exportFrame}>
          Export PNG
        </button>
        <p role="status" aria-label="Studio status">{status}</p>
      </aside>

      <section className="frame-studio__stage" style={previewStyle} aria-label="Frame preview">
        {previewUrl ? (
          <div className="frame-studio__frame">
            {/* A browser object URL is device-local and never sent to the application server. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Local frame preview" />
          </div>
        ) : (
          <div className="frame-studio__empty">
            <span aria-hidden="true">▧</span>
            <strong>Your image stays here.</strong>
            <p>Nothing is uploaded. Preview and PNG export happen in this browser.</p>
          </div>
        )}
      </section>
    </div>
  );
}
