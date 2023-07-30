// Simulation options
var dt = document.getElementById("slider_dt").value;
var fps = document.getElementById("slider_fps").value;

var sim_gravity = document.getElementById("cb_sim_gravity").checked;
var sim_advection = document.getElementById("cb_sim_advection").checked;

// Rendering options
var render_material = document.getElementById("cb_render_material").checked;
var render_velocity = document.getElementById("cb_render_velocity").checked;
var render_pressure = document.getElementById("cb_render_pressure").checked;

// Get the canvas element and its 2D context
const canvas = document.getElementById('canvas');

// Resize canvas
const parent_rect = document.getElementById("canvas_container").getBoundingClientRect();
canvas.width = parent_rect.width;
canvas.height = parent_rect.height;

// Initialize Fluid object
const px_size = 16;
var resolution_x = Math.floor(canvas.width / px_size)
var resolution_y = Math.floor(canvas.height / px_size)
var fluid = new Fluid(resolution_x, resolution_y)

var mouse_is_down = false
var mouse_x = 0
var mouse_y = 0

var is_running = true;

function update() {

    var click_power = 10000.0
    if (mouse_is_down) {
        fluid.u[(mouse_x) * fluid.size_y + mouse_y] -= click_power * dt
        fluid.m[(mouse_x) * fluid.size_y + mouse_y] += click_power * dt / 100;

        // fluid.u[(mouse_x + 1) * fluid.size_y + mouse_y] += click_power * dt
        // fluid.v[mouse_x * fluid.size_y + mouse_y] -= click_power * dt
        // fluid.v[mouse_x * fluid.size_y + mouse_y + 1] += click_power * dt
    }
    if (is_running) {
        fluid.update(dt, sim_gravity, sim_advection);
    }

    render_fluid(canvas, fluid, render_material, render_velocity, render_pressure);

    setTimeout(() => {
        requestAnimationFrame(update);
    }, 1000 / fps);
}


function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect()
    mouse_x = Math.floor((event.clientX - rect.left) / (rect.width / fluid.size_x))
    mouse_y = Math.floor((event.clientY - rect.top) / (rect.height / fluid.size_y))
    console.log("x: " + mouse_x + " y: " + mouse_y)
}

// Handle mouse events
canvas.addEventListener('mousedown', function (e) {
    getCursorPosition(canvas, e)
    mouse_is_down = true
})
canvas.addEventListener('mousemove', function (e) {
    if (mouse_is_down) {
        getCursorPosition(canvas, e)
    }
})
canvas.addEventListener('mouseup', function (e) {
    mouse_is_down = false
})

// Handle button presses
document.getElementById("cb_sim_gravity").onclick = function () { sim_gravity = this.checked; };
document.getElementById("cb_sim_advection").onclick = function () { sim_advection = this.checked; };

document.getElementById("btn_play").onclick = function () { is_running = true; update(); };
document.getElementById("btn_pause").onclick = function () { is_running = false; };
document.getElementById("btn_step").onclick = function () { if (!is_running) { fluid.update(0.05); } };
document.getElementById("btn_reset").onclick = function () { fluid = new Fluid(fluid.size_x, fluid.size_y); update(); };

document.getElementById("cb_render_material").onclick = function () { render_material = this.checked; };
document.getElementById("cb_render_velocity").onclick = function () { render_velocity = this.checked; };
document.getElementById("cb_render_pressure").onclick = function () { render_pressure = this.checked; };




// Update the current slider value (each time you drag the slider handle)
document.getElementById("slider_dt").oninput = function () { dt = this.value; document.getElementById("label_dt").innerHTML = this.value; }
document.getElementById("slider_fps").oninput = function () { fps = this.value; document.getElementById("label_fps").innerHTML = this.value; }


update()
