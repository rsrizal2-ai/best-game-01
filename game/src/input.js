// NEONVOID — keyboard and mouse input.
// One object owns every device fact the game loop needs: which movement
// keys are down, where the mouse is, whether the trigger is held, and a
// queue of clicks (with coordinates) for buttons.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.clicks = [];
    this.pressed = new Set();

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouseDown = false;
    });

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    });
    canvas.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      this.mouseDown = true;
      const rect = canvas.getBoundingClientRect();
      this.clicks.push({
        x: ((event.clientX - rect.left) / rect.width) * canvas.width,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      });
    });
    window.addEventListener('mouseup', (event) => {
      if (event.button === 0) this.mouseDown = false;
    });
    // Touch: treat a touch like a mouse hold so the game is tappable too.
    canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((touch.clientY - rect.top) / rect.height) * canvas.height;
      this.mouseDown = true;
      this.clicks.push({ x: this.mouseX, y: this.mouseY });
    }, { passive: false });
    canvas.addEventListener('touchend', (event) => {
      event.preventDefault();
      this.mouseDown = false;
    }, { passive: false });
  }

  // True only on the frame the key went down (for menus, pause, restart).
  wasPressed(code) {
    return this.pressed.has(code);
  }

  // Movement vector from WASD or arrow keys, normalized.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  // Consume the click queue; the caller checks each click against buttons.
  takeClicks() {
    const taken = this.clicks;
    this.clicks = [];
    return taken;
  }

  // Called at the end of every frame: single-press keys do not repeat.
  endFrame() {
    this.pressed.clear();
  }
}

// Hit test for a canvas-drawn button rectangle.
export function insideRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
