// Simulation options
var dt = document.getElementById("slider_dt").value;
var fps = document.getElementById("slider_fps").value;

var place_mode = CellType.empty;

// Get the canvas element and its 2D context
const canvas = document.getElementById('canvas');

// Resize canvas
const parent_rect = document.getElementById("canvas_container").getBoundingClientRect();
canvas.width = parent_rect.width;
canvas.height = parent_rect.height;

// Initialize Wave object
const px_size = 8;
var resolution_x = Math.floor(canvas.width / px_size)
var resolution_y = Math.floor(canvas.height / px_size)
var wave = new Wave(resolution_x, resolution_y)

var mouse_is_down = false
var mouse_x = 0
var mouse_y = 0
var mouse_prev_x = 0
var mouse_prev_y = 0

var is_running = true;

function update() {

    var x = Math.floor(mouse_x);
    var y = Math.floor(mouse_y);

    if (mouse_is_down && place_mode == CellType.empty) {

        var mouse_power = 4
        wave.u[(x) * wave.size_y + y] = mouse_power * mouse_power;
        wave.u[(x + 1) * wave.size_y + y] = mouse_power;
        wave.u[(x - 1) * wave.size_y + y] = mouse_power;
        wave.u[(x) * wave.size_y + y + 1] = mouse_power;
        wave.u[(x) * wave.size_y + y - 1] = mouse_power;

    }else if (mouse_is_down) {

        var x = Math.floor(mouse_x);
        var y = Math.floor(mouse_y);
        wave.set_cell(x, y, place_mode, 1.0);

    }

    if (is_running) {
        wave.update(dt);
    }

    render_wave(canvas, wave);

    document.getElementById("cell-stats").textContent = JSON.stringify(wave.get_cell_data(x, y), function (key, val) {
        return val.toFixed ? Number(val.toFixed(2)) : val;
    }, 2);

    setTimeout(() => {
        requestAnimationFrame(update);
    }, 1000 / fps);
}


function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect()
    mouse_prev_x = mouse_x;
    mouse_prev_y = mouse_y;
    mouse_x = (event.clientX - rect.left) / (rect.width / wave.size_x)
    mouse_y = (event.clientY - rect.top) / (rect.height / wave.size_y)
}

// Handle mouse events
canvas.addEventListener('mousedown', function (e) {
    getCursorPosition(canvas, e)
    mouse_is_down = true

})
canvas.addEventListener('mousemove', function (e) {
    getCursorPosition(canvas, e)
})
canvas.addEventListener('mouseup', function (e) {
    mouse_is_down = false
})

// Handle button presses
document.getElementById("radio_place_interact").onclick = function () {  place_mode = CellType.empty};
document.getElementById("radio_place_reflector").onclick = function () { place_mode = CellType.reflector };
document.getElementById("radio_place_generator").onclick = function () { place_mode = CellType.generator };


document.getElementById("btn_play").onclick = function () { is_running = true; update(); };
document.getElementById("btn_pause").onclick = function () { is_running = false; };
document.getElementById("btn_step").onclick = function () { if (!is_running) { wave.update(dt); } };
document.getElementById("btn_reset").onclick = function () { wave = new Wave(wave.size_x, wave.size_y); update(); };

// Update slider values
document.getElementById("slider_dt").oninput = function () { dt = this.value; document.getElementById("label_dt").innerHTML = this.value; }
document.getElementById("slider_fps").oninput = function () { fps = this.value; document.getElementById("label_fps").innerHTML = this.value; }


update()
