// Input Manager - handles keyboard and mouse input
class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.mouseClicked = false; // true for one frame on click
        this.clickHandlers = [];

        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouseDown = true;
                this.mouseClicked = true;
                // Fire click handlers for UI
                for (const handler of this.clickHandlers) {
                    handler(this.mouseX, this.mouseY);
                }
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouseDown = false;
            }
        });

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    isKeyDown(key) {
        return !!this.keys[key];
    }

    getMousePos() {
        return { x: this.mouseX, y: this.mouseY };
    }

    isMouseDown() {
        return this.mouseDown;
    }

    consumeClick() {
        const clicked = this.mouseClicked;
        this.mouseClicked = false;
        return clicked;
    }

    onClickThisFrame(handler) {
        this.clickHandlers.push(handler);
    }

    clearClickHandlers() {
        this.clickHandlers = [];
    }

    endFrame() {
        this.mouseClicked = false;
    }
}
