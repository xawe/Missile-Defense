export class InputHandler {
    constructor() {
        this.mouse = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.isSpaceDown = false;
        this.keys = {};

        // Events
        window.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            if (e.code === 'Space') this.isSpaceDown = true;

            // Dispatch custom event for weapon switching or other one-off actions if needed
            // For now, we'll let Game class poll state or listen to window events itself for one-offs 
            // if we prefer, but encapsulation is better.
        });

        window.addEventListener('keyup', e => {
            this.keys[e.key] = false;
            if (e.code === 'Space') this.isSpaceDown = false;
        });

        window.addEventListener('mousedown', () => {
            this.isMouseDown = true;
        });

        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
    }
}
