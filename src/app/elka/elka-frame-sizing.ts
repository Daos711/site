/** Site-side adapter for the bundle's #app / #battle[hidden] screen contract. */
export function watchElkaFrame(
  frame: HTMLIFrameElement,
  battleHeight: string,
  minHeight: number,
): () => void {
  const view = frame.ownerDocument.defaultView;
  if (!view) return () => {};

  let disconnectDocument = () => {};

  const connectDocument = () => {
    disconnectDocument();
    frame.style.height = battleHeight;

    let document: Document | null;
    try {
      document = frame.contentDocument;
    } catch {
      return;
    }
    const app = document?.getElementById("app");
    const battle = document?.getElementById("battle");
    if (!document || !app || !battle) return;

    // In menus, the viewport must not become the minimum measured content height.
    // Battle retains the bundle's original viewport-based layout rules.
    const styles = document.createElement("style");
    styles.textContent = `
      html[data-elka-frame-mode="menu"],
      html[data-elka-frame-mode="menu"] body,
      html[data-elka-frame-mode="menu"] #app { min-height: 0 !important; }
      html, body { overflow-y: hidden !important; }
    `;
    document.head.appendChild(styles);

    let mode: "menu" | "battle" | undefined;
    let animationFrame = 0;
    let disconnected = false;

    const measureMenu = () => {
      animationFrame = 0;
      // Recheck the actual screen as well: a queued callback can outlive a transition.
      if (disconnected || mode !== "menu" || !battle.hidden) return;
      const height = `${Math.max(minHeight, Math.ceil(app.getBoundingClientRect().height))}px`;
      if (frame.style.height !== height) frame.style.height = height;
    };
    const scheduleMenu = () => {
      if (!disconnected && mode === "menu" && battle.hidden && !animationFrame) {
        animationFrame = view.requestAnimationFrame(measureMenu);
      }
    };
    const menuObserver = new view.ResizeObserver(scheduleMenu);

    const syncScreen = () => {
      if (disconnected) return;
      const nextMode = battle.hidden ? "menu" : "battle";
      if (nextMode === mode) return;
      mode = nextMode;
      menuObserver.disconnect();
      view.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      document.documentElement.dataset.elkaFrameMode = mode;

      if (mode === "battle") {
        // One CSS assignment per screen transition; no battle size reads or observers.
        frame.style.height = battleHeight;
      } else {
        // #app has natural height in this mode, unlike the document's scrollHeight floor.
        menuObserver.observe(app);
        scheduleMenu();
      }
    };
    const screenObserver = new view.MutationObserver(syncScreen);
    screenObserver.observe(battle, { attributes: true, attributeFilter: ["hidden"] });
    syncScreen();

    disconnectDocument = () => {
      disconnected = true;
      view.cancelAnimationFrame(animationFrame);
      menuObserver.disconnect();
      screenObserver.disconnect();
      styles.remove();
      delete document.documentElement.dataset.elkaFrameMode;
    };
  };

  frame.addEventListener("load", connectDocument);
  connectDocument();
  return () => {
    frame.removeEventListener("load", connectDocument);
    disconnectDocument();
  };
}
