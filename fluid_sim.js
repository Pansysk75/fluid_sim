
// Get the canvas element and its 2D context
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

class Fluid {
    constructor(size_x, size_y) {
        this.size_x = size_x
        this.size_y = size_y

        this.num_cells = this.size_x * this.size_y;

        this.u = Array(this.num_cells).fill(0) // Velocity in x direction
        this.v = Array(this.num_cells).fill(0) // Velocity in y direction

        this.s = Array(this.num_cells).fill(1.0) // "Fluidity" of cell

        for (var i = 0; i < this.size_x; i++) {
            for (var j = 0; j < this.size_y; j++) {
                if (i == 0 || i == (this.size_x - 1) || j == (this.size_y - 1) || j == (0)) {
                    this.s[i * this.size_y + j] == 0.0;
                }
            }
        }

        this.p = Array(this.num_cells).fill(0) // Pressure

        this.new_u = Array(this.num_cells).fill(0)
        this.new_v = Array(this.num_cells).fill(0)

    }


    calc_gravity(dt) {
        // Add downward due to gravity
        const n = this.size_y;
        const gravity = 9.8 // m/s
        for (var i = 0; i < this.size_x; i++) {
            for (var j = 0; j < this.size_y - 1; j++) {
                if (this.s[i * n + j] != 0.0 && this.s[i * n + j + 1] != 0.0) {
                    this.v[i * n + j] += gravity * dt;
                }
            }
        }
    }

    solve_incompressibility(dt, iterations) {

        // Since we assume an incompressible fluid, flow in must equal flow out for each cell
        const n = this.size_y;
        for (var iter = 0; iter < iterations; iter++) {

            this.new_u = this.u.slice();
            this.new_v = this.v.slice();
            for (var i = 1; i < this.size_x - 1; i++) {
                for (var j = 1; j < this.size_y - 1; j++) {

                    var d = - this.u[(i + 1) * n + j] + this.u[i * n + j] - this.v[i * n + j + 1] + this.v[i * n + j]

                    var sx0 = this.s[(i - 1) * n + j];
                    var sx1 = this.s[(i + 1) * n + j];
                    var sy0 = this.s[i * n + j - 1];
                    var sy1 = this.s[i * n + j + 1];
                    var s = sx0 + sx1 + sy0 + sy1;

                    if (s == 0.0) {
                        continue;
                    }

                    d = d / s
                    d = (1.0 * d)

                    this.p[i * n + j] += d // not accurate, but it's only used in visualization anyways

                    this.new_u[i * n + j] -= sx0 * d
                    this.new_v[i * n + j] -= sy0 * d
                    this.new_u[(i + 1) * n + j] += sx1 * d
                    this.new_v[(i * n + j + 1)] += sy1 * d
                }
            }
            this.u = this.new_u.slice();
            this.v = this.new_v.slice();
        }
    }


    get_u_at(x, y) {
        if (x > 0 && x < this.size_x &&
            y > 0 && y < this.size_y) {
            return this.u[x * this.size_y + y]
        } else {
            return 0
        }
    }

    get_v_at(x, y) {
        if (x > 0 && x < this.size_x &&
            y > 0 && y < this.size_y) {
            return this.v[x * this.size_y + y]
        } else {
            return 0
        }
    }

    avgU(x, y) {
        var u = (this.get_u_at(x, y - 1) + this.get_u_at(x, y) +
            this.get_u_at(x + 1, y - 1) + this.get_u_at(x + 1, y)) * 0.25;
        return u;
    }

    avgV(x, y) {
        var v = (this.get_v_at(x, y - 1) + this.get_v_at(x, y) +
            this.get_v_at(x + 1, y - 1) + this.get_v_at(x + 1, y)) * 0.25;
        return v;
    }

    interpolate_fluid(x, y) {

        var x_floor = Math.floor(x)
        var y_floor = Math.floor(y)
        var x_ceil = Math.ceil(x)
        var y_ceil = Math.ceil(y)

        var x_adv = x - x_floor
        var y_adv = y - y_floor

        var v00 = this.get_v_at(x_floor, y_floor)
        var v10 = this.get_v_at(x_ceil, y_floor)
        var v01 = this.get_v_at(x_floor, y_ceil)
        var v11 = this.get_v_at(x_ceil, y_ceil)

        var v_up = v00 * (x_adv - 1) + v10 * (1 - x_adv)
        // v_up /= 2
        var v_down = v01 * (x_adv - 1) + v11 * (1 - x_adv)
        // v_down /= 2
        var v_interp = v_up * (y_adv - 1) + v_down * (1 - y_adv)


        var u00 = this.get_u_at(x_floor, y_floor)
        var u10 = this.get_u_at(x_ceil, y_floor)
        var u01 = this.get_u_at(x_floor, y_ceil)
        var u11 = this.get_u_at(x_ceil, y_ceil)

        var u_up = u00 * (x_adv - 1) + u10 * (1 - x_adv)
        // u_up /= 2
        var u_down = u01 * (x_adv - 1) + u11 * (1 - x_adv)
        // u_down /= 2
        var u_interp = u_up * (y_adv - 1) + u_down * (1 - y_adv)

        // var u_interp = this.avgU(x, y)
        // var v_interp = this.avgV(x, y)

        return [u_interp, v_interp]
    }

    advect(dt) {
        // Since in reality a fluid is comprised of moving particles (and we only have a static grid),
        // we mimic the movement of particles by transferring velocities. Each cell inherits the velocity
        // of the cell where we estimate it would have "come from" (by subtracting u*dt from the current position).
        this.new_u = this.u.slice();
        this.new_v = this.v.slice();

        const n = this.size_y;

        for (var x = 0; x < this.size_x; x++) {
            for (var y = 0; y < this.size_y; y++) {

                if (this.s[x * n + y] == 0.0) {
                    continue
                }

                var u_here = this.avgU[x * n + y]
                // var x_prev = Math.floor(x - u_here * dt)
                var x_prev = x //- u_here * dt

                var v_here = this.avgV[x * n + y]
                // var y_prev = Math.floor(y - v_here * dt)
                var y_prev = y //- v_here * dt

                var u_v_interp = this.interpolate_fluid(x_prev, y_prev)
                this.new_u[x * n + y] = u_v_interp[0]
                this.new_v[x * n + y] = u_v_interp[1]

            }
        }

        this.u = this.new_u.slice();
        this.v = this.new_v.slice();

    }
}

// var fluid = new Fluid(canvas.width, canvas.height)
var fluid = new Fluid(50, 50)


function draw() {

    id = ctx.getImageData(0, 0, canvas.width, canvas.height)

    var r = 0
    var g = 0
    var b = 0

    const n = fluid.size_y;

    var p = 0
    for (var i = 0; i < fluid.size_x; i++) {
        for (var j = 0; j < fluid.size_y; j++) {

            // r = Math.abs((fluid.u[j * n + i] + fluid.v[j * n + i]) / 2)
            // g = Math.abs((fluid.u[j * n + i] - fluid.v[j * n + i]) / 2)
            // b = Math.abs((-fluid.u[j * n + i] - fluid.v[j * n + i]) / 2)


            // r = Math.max(fluid.v[j * n + i], 0)
            // g = Math.max(fluid.u[j * n + i], 0)
            // b = Math.max(-fluid.v[j * n + i], 0)
            if (fluid.s[j * n + i] == 0) {
                r = 0
                g = 0
                b = 0
            } else {
                r = fluid.p[i * n + j]
                g = fluid.p[i * n + j] + Math.abs(fluid.u[i * n + j])
                b = fluid.p[i * n + j] + Math.abs(fluid.v[i * n + j])
            }


            r *= 255
            g *= 255
            b *= 255

            // r = 255
            // g = 0
            // b = 255

            var px_begin = Math.floor(i * canvas.width / fluid.size_x)
            var px_end = Math.floor((i + 1) * canvas.width / fluid.size_x)

            var py_begin = Math.floor(j * canvas.height / fluid.size_y)
            var py_end = Math.floor((j + 1) * canvas.height / fluid.size_y)


            for (var iy = py_begin; iy < py_end; iy++) {
                var p = 4 * (iy * canvas.width + px_begin)
                for (var ix = px_begin; ix < px_end; ix++) {
                    id.data[p++] = r;
                    id.data[p++] = g;
                    id.data[p++] = b;
                    id.data[p++] = 255;
                }

            }
        }
    }

    ctx.putImageData(id, 0, 0);

}

var mouse_is_down = false
var mouse_x = 0
var mouse_y = 0

function update() {
    fps = 60
    dt = 0.01

    fluid.p.fill(0.0);
    // fluid.calc_gravity(dt)
    fluid.solve_incompressibility(dt, 1)
    // fluid.advect(dt)

    var click_power = 1000.0
    if (mouse_is_down) {
        fluid.u[(mouse_x) * fluid.size_y + mouse_y] -= click_power * dt
        fluid.u[(mouse_x + 1) * fluid.size_y + mouse_y] += click_power * dt
        fluid.v[mouse_x * fluid.size_y + mouse_y] -= click_power * dt
        fluid.v[mouse_x * fluid.size_y + mouse_y + 1] += click_power * dt
    }

    draw()

    setTimeout(() => {
        requestAnimationFrame(update);
    }, 1000 / fps);
}

function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect()
    mouse_x = Math.floor((event.clientX - rect.left) / (canvas.width / fluid.size_x))
    mouse_y = Math.floor((event.clientY - rect.top) / (canvas.height / fluid.size_y))
    console.log("x: " + mouse_x + " y: " + mouse_y)
}

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


update()
