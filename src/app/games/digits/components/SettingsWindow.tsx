"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  SIZE_PRESETS,
  SPEED_PRESETS,
  SIZE_ORDER,
  SPEED_ORDER,
  SizePreset,
  SpeedPreset,
} from "@/lib/digits-settings";

interface SettingsWindowProps {
  currentSize: SizePreset;
  currentSpeed: SpeedPreset;
  onSizeChange: (size: SizePreset) => void;
  onSpeedChange: (speed: SpeedPreset) => void;
  onClose: () => void;
}

export function SettingsWindow({
  currentSize,
  currentSpeed,
  onSizeChange,
  onSpeedChange,
  onClose,
}: SettingsWindowProps) {
  const handlePrevSize = () => {
    const idx = SIZE_ORDER.indexOf(currentSize);
    const newIdx = (idx - 1 + SIZE_ORDER.length) % SIZE_ORDER.length;
    onSizeChange(SIZE_ORDER[newIdx]);
  };

  const handleNextSize = () => {
    const idx = SIZE_ORDER.indexOf(currentSize);
    const newIdx = (idx + 1) % SIZE_ORDER.length;
    onSizeChange(SIZE_ORDER[newIdx]);
  };

  const handlePrevSpeed = () => {
    const idx = SPEED_ORDER.indexOf(currentSpeed);
    const newIdx = (idx - 1 + SPEED_ORDER.length) % SPEED_ORDER.length;
    onSpeedChange(SPEED_ORDER[newIdx]);
  };

  const handleNextSpeed = () => {
    const idx = SPEED_ORDER.indexOf(currentSpeed);
    const newIdx = (idx + 1) % SPEED_ORDER.length;
    onSpeedChange(SPEED_ORDER[newIdx]);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div
        className="relative p-6 shadow-2xl"
        style={{
          background: "rgb(247, 204, 74)",
          border: "2px solid rgb(162, 140, 40)",
          minWidth: "320px",
        }}
      >
        {/* Заголовок с кнопкой закрытия */}
        <div
          className="flex items-center justify-between mb-6 pb-3"
          style={{ borderBottom: "1px solid rgb(162, 140, 40)" }}
        >
          <h2
            className="text-xl font-bold"
            style={{ color: "rgb(71, 74, 72)" }}
          >
            Настройки
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            style={{ color: "rgb(71, 74, 72)" }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Размер */}
        <div className="mb-5">
          <div
            className="text-sm mb-2 font-medium"
            style={{ color: "rgb(71, 74, 72)" }}
          >
            Размер
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevSize}
              className="p-2 rounded hover:bg-black/10 transition-colors"
              style={{ color: "rgb(71, 74, 72)" }}
            >
              <ChevronLeft size={24} />
            </button>
            <div
              className="flex-1 text-center py-2 px-4 font-medium"
              style={{
                background: "rgba(255, 255, 255, 0.5)",
                border: "1px solid rgb(162, 140, 40)",
                color: "rgb(71, 74, 72)",
                minWidth: "140px",
              }}
            >
              {SIZE_PRESETS[currentSize].name}
            </div>
            <button
              onClick={handleNextSize}
              className="p-2 rounded hover:bg-black/10 transition-colors"
              style={{ color: "rgb(71, 74, 72)" }}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Скорость */}
        <div className="mb-6">
          <div
            className="text-sm mb-2 font-medium"
            style={{ color: "rgb(71, 74, 72)" }}
          >
            Скорость
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevSpeed}
              className="p-2 rounded hover:bg-black/10 transition-colors"
              style={{ color: "rgb(71, 74, 72)" }}
            >
              <ChevronLeft size={24} />
            </button>
            <div
              className="flex-1 text-center py-2 px-4 font-medium"
              style={{
                background: "rgba(255, 255, 255, 0.5)",
                border: "1px solid rgb(162, 140, 40)",
                color: "rgb(71, 74, 72)",
                minWidth: "140px",
              }}
            >
              {SPEED_PRESETS[currentSpeed].name}
            </div>
            <button
              onClick={handleNextSpeed}
              className="p-2 rounded hover:bg-black/10 transition-colors"
              style={{ color: "rgb(71, 74, 72)" }}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Информация */}
        <div
          className="text-xs text-center"
          style={{ color: "rgb(100, 100, 100)" }}
        >
          Изменение размера перезапустит игру
        </div>
      </div>
    </div>
  );
}
