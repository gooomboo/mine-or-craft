import { useState } from "react";
import type { CameraMode, CrosshairStyle, Difficulty, GraphicsPreset, Settings } from "@/game/types";
import { DEFAULT_SETTINGS } from "@/game/types";
import { useApp } from "@/store/app-store";

type Tab = "video" | "controls" | "audio" | "gameplay" | "hud";

function McBtn({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mc-btn ${primary ? "mc-btn-primary" : ""} min-h-11 w-full px-4 py-2.5 text-lg`}
    >
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      {children}
    </label>
  );
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step ?? 1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-accent"
    />
  );
}

function Checks({
  items,
  settings,
  set,
}: {
  items: [keyof Settings, string][];
  settings: Settings;
  set: (s: Partial<Settings>) => void;
}) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
      {items.map(([k, lab]) => (
        <label key={k} className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(settings[k])}
            onChange={(e) => set({ [k]: e.target.checked })}
          />
          {lab}
        </label>
      ))}
    </div>
  );
}

export function SettingsPanel({ fromPause }: { fromPause: boolean }) {
  const settings = useApp((s) => s.settings);
  const setSettings = useApp((s) => s.setSettings);
  const setOverlay = useApp((s) => s.setOverlay);
  const setPhase = useApp((s) => s.setPhase);
  const [tab, setTab] = useState<Tab>("video");

  const tabs: { id: Tab; label: string }[] = [
    { id: "video", label: "Video" },
    { id: "controls", label: "Controls" },
    { id: "audio", label: "Sound" },
    { id: "gameplay", label: "Gameplay" },
    { id: "hud", label: "HUD" },
  ];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-3">
      <div className="mc-panel max-h-[92dvh] w-full max-w-xl overflow-y-auto p-4 sm:p-5">
        <h2 className="pixel-title mb-3 text-2xl">Settings</h2>
        <div className="mb-4 flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`mc-btn min-h-10 px-3 py-1 text-sm ${tab === t.id ? "mc-btn-primary" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "video" && (
          <>
            <Row label={`Graphics (${settings.graphics})`}>
              <select
                value={settings.graphics}
                onChange={(e) => {
                  const graphics = e.target.value as GraphicsPreset;
                  const patch: Partial<Settings> = { graphics };
                  if (graphics === "fast") {
                    patch.ao = false;
                    patch.particles = false;
                    patch.clouds = false;
                    patch.fancyWater = false;
                    patch.shadows = false;
                    patch.antialias = false;
                    patch.pixelRatioCap = 1;
                  } else if (graphics === "fancy") {
                    patch.ao = true;
                    patch.particles = true;
                    patch.clouds = true;
                    patch.fancyWater = true;
                    patch.shadows = false;
                    patch.antialias = true;
                    patch.pixelRatioCap = 1.5;
                  } else {
                    patch.ao = true;
                    patch.particles = true;
                    patch.clouds = true;
                    patch.fancyWater = true;
                    patch.shadows = true;
                    patch.antialias = true;
                    patch.pixelRatioCap = 2;
                    patch.stars = true;
                    patch.sunMoon = true;
                    patch.weatherFx = true;
                  }
                  setSettings(patch);
                }}
                className="min-h-11 w-full border-2 border-black bg-elevated px-2"
              >
                <option value="fast">Fast — performance</option>
                <option value="fancy">Fancy — balanced</option>
                <option value="fabulous">Fabulous — max quality</option>
              </select>
            </Row>
            <Row label={`Render distance (${settings.renderDistance} chunks)`}>
              <Slider
                min={2}
                max={12}
                value={settings.renderDistance}
                onChange={(n) => setSettings({ renderDistance: n })}
              />
            </Row>
            <Row label={`FOV (${settings.fov})`}>
              <Slider min={50} max={110} value={settings.fov} onChange={(n) => setSettings({ fov: n })} />
            </Row>
            <Row label={`Brightness (${settings.brightness.toFixed(2)})`}>
              <Slider
                min={0.4}
                max={1.8}
                step={0.02}
                value={settings.brightness}
                onChange={(n) => setSettings({ brightness: n })}
              />
            </Row>
            <Row label={`Pixel scale (${settings.pixelRatioCap.toFixed(1)}x)`}>
              <Slider
                min={0.75}
                max={2}
                step={0.25}
                value={settings.pixelRatioCap}
                onChange={(n) => setSettings({ pixelRatioCap: n })}
              />
            </Row>
            <Row label={`Max FPS (${settings.maxFps === 0 ? "unlimited" : settings.maxFps})`}>
              <Slider min={0} max={240} step={15} value={settings.maxFps} onChange={(n) => setSettings({ maxFps: n })} />
            </Row>
            <Checks
              items={[
                ["ao", "Smooth lighting"],
                ["shadows", "Shadows (Fabulous)"],
                ["clouds", "Clouds"],
                ["particles", "Particles"],
                ["fancyWater", "Fancy water"],
                ["fancyLeaves", "Fancy plants"],
                ["fog", "Fog"],
                ["stars", "Stars"],
                ["sunMoon", "Sun & moon"],
                ["weatherFx", "Weather"],
                ["vignette", "Vignette"],
                ["antialias", "Anti-alias"],
                ["vsync", "VSync"],
              ]}
              settings={settings}
              set={setSettings}
            />
          </>
        )}

        {tab === "controls" && (
          <>
            <Row label={`Mouse sensitivity (${settings.mouseSens.toFixed(2)})`}>
              <Slider
                min={0.04}
                max={0.7}
                step={0.01}
                value={settings.mouseSens}
                onChange={(n) => setSettings({ mouseSens: n })}
              />
            </Row>
            <Row label={`Touch look (${settings.touchLookSens.toFixed(2)})`}>
              <Slider
                min={0.3}
                max={2.2}
                step={0.05}
                value={settings.touchLookSens}
                onChange={(n) => setSettings({ touchLookSens: n })}
              />
            </Row>
            <Row label={`Touch size (${settings.touchSize.toFixed(1)})`}>
              <Slider
                min={0.7}
                max={1.6}
                step={0.05}
                value={settings.touchSize}
                onChange={(n) => setSettings({ touchSize: n })}
              />
            </Row>
            <Checks
              items={[
                ["invertY", "Invert Y"],
                ["invertX", "Invert X"],
                ["autoJump", "Auto jump"],
                ["sneakToggle", "Toggle sneak"],
                ["sprintToggle", "Toggle sprint"],
                ["viewBob", "View bobbing"],
                ["handBob", "Hand bobbing"],
              ]}
              settings={settings}
              set={setSettings}
            />
            <p className="mb-3 text-xs text-muted">
              WASD move · mouse look · Space jump · Shift sneak · Ctrl/R sprint · E inventory · F5 camera · F3 debug
            </p>
          </>
        )}

        {tab === "audio" && (
          <>
            <Row label={`Master (${Math.round(settings.volumeMaster * 100)}%)`}>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={settings.volumeMaster}
                onChange={(n) => setSettings({ volumeMaster: n })}
              />
            </Row>
            <Row label={`Music (${Math.round(settings.volumeMusic * 100)}%)`}>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={settings.volumeMusic}
                onChange={(n) => setSettings({ volumeMusic: n })}
              />
            </Row>
            <Row label={`Effects (${Math.round(settings.volumeSfx * 100)}%)`}>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={settings.volumeSfx}
                onChange={(n) => setSettings({ volumeSfx: n })}
              />
            </Row>
            <Row label={`Ambience (${Math.round(settings.volumeAmbient * 100)}%)`}>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={settings.volumeAmbient}
                onChange={(n) => setSettings({ volumeAmbient: n })}
              />
            </Row>
            <Checks items={[["subtitles", "Subtitles"]]} settings={settings} set={setSettings} />
          </>
        )}

        {tab === "gameplay" && (
          <>
            <Row label="Difficulty">
              <select
                value={settings.difficulty}
                onChange={(e) => setSettings({ difficulty: e.target.value as Difficulty })}
                className="min-h-11 w-full border-2 border-black bg-elevated px-2"
              >
                <option value="peaceful">Peaceful — no hostiles</option>
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </Row>
            <Row label="Camera">
              <select
                value={settings.cameraMode}
                onChange={(e) => setSettings({ cameraMode: e.target.value as CameraMode })}
                className="min-h-11 w-full border-2 border-black bg-elevated px-2"
              >
                <option value="first">First person</option>
                <option value="third">Third person</option>
                <option value="front">Front view</option>
              </select>
            </Row>
            <Row label={`Screen shake (${Math.round(settings.screenShake * 100)}%)`}>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={settings.screenShake}
                onChange={(n) => setSettings({ screenShake: n })}
              />
            </Row>
            <Row label={`Auto-save (${settings.autoSave}s)`}>
              <Slider min={3} max={30} value={settings.autoSave} onChange={(n) => setSettings({ autoSave: n })} />
            </Row>
            <Checks
              items={[
                ["reducedMotion", "Reduced motion"],
                ["heldItem", "Show held item"],
                ["blockOutline", "Block outline"],
              ]}
              settings={settings}
              set={setSettings}
            />
          </>
        )}

        {tab === "hud" && (
          <>
            <Row label="Crosshair">
              <select
                value={settings.crosshair}
                onChange={(e) => setSettings({ crosshair: e.target.value as CrosshairStyle })}
                className="min-h-11 w-full border-2 border-black bg-elevated px-2"
              >
                <option value="cross">Cross</option>
                <option value="dot">Dot</option>
                <option value="circle">Circle</option>
                <option value="off">Hidden</option>
              </select>
            </Row>
            <Row label={`GUI scale (${settings.guiScale.toFixed(1)})`}>
              <Slider
                min={0.8}
                max={1.5}
                step={0.05}
                value={settings.guiScale}
                onChange={(n) => setSettings({ guiScale: n })}
              />
            </Row>
            <Row label={`Chat opacity (${Math.round(settings.chatOpacity * 100)}%)`}>
              <Slider
                min={0.2}
                max={1}
                step={0.05}
                value={settings.chatOpacity}
                onChange={(n) => setSettings({ chatOpacity: n })}
              />
            </Row>
            <Checks
              items={[
                ["showFps", "Show FPS"],
                ["showCoords", "Coordinates"],
                ["showBiome", "Biome name"],
              ]}
              settings={settings}
              set={setSettings}
            />
          </>
        )}

        <div className="mt-2 flex gap-2">
          <McBtn
            onClick={() => {
              setSettings({ ...DEFAULT_SETTINGS });
            }}
          >
            Reset
          </McBtn>
          <McBtn
            primary
            onClick={() => {
              if (fromPause) setOverlay("pause");
              else {
                setOverlay("none");
                setPhase("menu");
              }
            }}
          >
            Done
          </McBtn>
        </div>
      </div>
    </div>
  );
}
