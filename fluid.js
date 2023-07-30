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
                if ((i == 0) || (i == (this.size_x - 1)) || (j == (this.size_y - 1)) || (j == 0)) {
                    this.s[i * this.size_y + j] = 0.0;
                }
            }
        }

        this.p = Array(this.num_cells).fill(0) // Pressure

        this.m = Array(this.num_cells).fill(0.2) // Material

        // Buffers for iterating
        this.new_u = Array(this.num_cells).fill(0)
        this.new_v = Array(this.num_cells).fill(0)
        this.new_m = Array(this.num_cells).fill(0)


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

            // this.new_u = this.u.slice();
            // this.new_v = this.v.slice();
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

                    d = 1.8 * d / s

                    this.p[i * n + j] += d * 0.1; // not accurate, but it's only used in visualization anyways


                    // this.new_u[i * n + j] -= sx0 * d
                    // this.new_v[i * n + j] -= sy0 * d
                    // this.new_u[(i + 1) * n + j] += sx1 * d
                    // this.new_v[(i * n + j + 1)] += sy1 * d

                    this.u[i * n + j] -= sx0 * d
                    this.v[i * n + j] -= sy0 * d
                    this.u[(i + 1) * n + j] += sx1 * d
                    this.v[(i * n + j + 1)] += sy1 * d
                }
            }
            // this.u = this.new_u.slice();
            // this.v = this.new_v.slice();
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

    get_m_at(x, y) {
        if (x > 0 && x < this.size_x &&
            y > 0 && y < this.size_y) {
            return this.m[x * this.size_y + y]
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
    avgM(x, y) {
        var v = (this.get_m_at(x, y) + this.get_m_at(x + 1, y) +
            this.get_m_at(x - 1, y) + this.get_m_at(x, y + 1) * this.get_m_at(x, y - 1)) * 0.2;
        return v;
    }

    interpolate_velocities(x, y) {

        // var x_floor = Math.floor(x)
        // var y_floor = Math.floor(y)
        // var x_ceil = Math.ceil(x)
        // var y_ceil = Math.ceil(y)

        // var x_adv = x - x_floor
        // var y_adv = y - y_floor

        // var v00 = this.get_v_at(x_floor, y_floor)
        // var v10 = this.get_v_at(x_ceil, y_floor)
        // var v01 = this.get_v_at(x_floor, y_ceil)
        // var v11 = this.get_v_at(x_ceil, y_ceil)

        // var v_up = v00 * (x_adv - 1) + v10 * x_adv
        // var v_down = v01 * (x_adv - 1) + v11 * x_adv
        // var v_interp = v_up * (y_adv - 1) + v_down * y_adv

        // var u00 = this.get_u_at(x_floor, y_floor)
        // var u10 = this.get_u_at(x_ceil, y_floor)
        // var u01 = this.get_u_at(x_floor, y_ceil)
        // var u11 = this.get_u_at(x_ceil, y_ceil)

        // var u_up = u00 * (x_adv - 1) + u10 * x_adv
        // var u_down = u01 * (x_adv - 1) + u11 * x_adv
        // var u_interp = u_up * (y_adv - 1) + u_down * y_adv

        var u_interp = this.avgU(x, y)
        var v_interp = this.avgV(x, y)

        return [u_interp, v_interp];
    }

    interpolate_material(x, y) {

        // var x_floor = Math.floor(x)
        // var y_floor = Math.floor(y)
        // var x_ceil = Math.ceil(x)
        // var y_ceil = Math.ceil(y)

        // var x_adv = x - x_floor
        // var y_adv = y - y_floor

        // var m00 = this.get_m_at(x_floor, y_floor)
        // var m10 = this.get_m_at(x_ceil, y_floor)
        // var m01 = this.get_m_at(x_floor, y_ceil)
        // var m11 = this.get_m_at(x_ceil, y_ceil)

        // var m_up = m00 * (x_adv - 1) + m10 * x_adv
        // var m_down = m01 * (x_adv - 1) + m11 * x_adv
        // var m_interp = m_up * (y_adv - 1) + m_down * y_adv

        var m_interp = this.avgM(x, y)

        return m_interp;
    }

    advect_velocity(dt) {
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

                var u_here = this.avgU(x * n + y)
                // var x_prev = Math.floor(x - u_here * dt)
                var x_prev = x - u_here * dt

                var v_here = this.avgV(x * n + y)
                // var y_prev = Math.floor(y - v_here * dt)
                var y_prev = y - v_here * dt

                var u_v_interp = this.interpolate_velocities(x_prev, y_prev)
                this.new_u[x * n + y] = u_v_interp[0]
                this.new_v[x * n + y] = u_v_interp[1]

            }
        }

        this.u = this.new_u.slice();
        this.v = this.new_v.slice();

    }

    advect_material(dt) {

        this.new_m = this.m.slice();
        const n = this.size_y;

        for (var x = 0; x < this.size_x; x++) {
            for (var y = 0; y < this.size_y; y++) {

                if (this.s[x * n + y] == 0.0) {
                    continue
                }

                var u_here = this.avgU(x * n + y)
                var x_prev = x - u_here * dt

                var v_here = this.avgV(x * n + y)
                var y_prev = y - v_here * dt

                this.new_m[x * n + y] = this.interpolate_material(x_prev, y_prev)
                // this.new_m[x * n + y] = this.get_m_at(x_prev, y_prev)


            }
        }

        this.m = this.new_m.slice();

    }

    update(dt, sim_gravity, sim_advection) {

        this.p.fill(0.0);

        if (sim_gravity) {
            this.calc_gravity(dt);
        }

        this.solve_incompressibility(dt, 1);

        if (sim_advection) {
            this.advect_velocity(dt);
            this.advect_material(dt);
        }

    }
}

// Helps with the rendering by calculating a time-varying weight to adjust the exposure
class ExposureHelper{
    constructor(){
        this.min = 0.0
        this.min_old = 0.0
        this.max = 1.0
        this.max_old = 1.0
    }
    // Adjust the values that do the actual exposing, call every frame or so
    update(amt){
        var overexposure = 0.99
        this.min_old = (this.min_old * (1-amt)) + this.min*amt;
        this.max_old = (this.max_old * (1-amt)) + this.max*amt*overexposure;

        if(this.min_old >= this.max_old) this.max_old = this.min_old + 0.0001;
    }
    // Transform a value according to the exposure
    apply(val){
        return (val-this.min_old)/(this.max_old-this.min_old);
    }
};

p_exposure = new ExposureHelper();

function render_fluid(canvas, fluid, render_material, render_velocity, render_pressure) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    id = ctx.getImageData(0, 0, canvas.width, canvas.height)

    var r = 0
    var g = 0
    var b = 0

    const n = fluid.size_y;

    p_exposure.update(0.04);

    for (var i = 0; i < fluid.size_x; i++) {
        for (var j = 0; j < fluid.size_y; j++) {

            r = 0
            g = 0
            b = 0

            if (fluid.s[i * n + j] != 0) {
                if (render_material) {
                    r += (fluid.m[i * n + j]) * 255
                    g += (fluid.m[i * n + j]) * 255
                    b += (fluid.m[i * n + j]) * 255
                }
                if (render_velocity) {
                    g += Math.max(fluid.u[i * n + j], 0)
                    b += Math.max(-fluid.u[i * n + j], 0)
                    // g += Math.abs(fluid.u[i * n + j])
                    // b += Math.abs(fluid.v[i * n + j])
                }
                if (render_pressure) {
                    var p = fluid.p[i * n + j]

                    if(p < p_exposure.min) p_exposure.min = p;
                    if(p > p_exposure.max) p_exposure.max = p;
                    val = 255 * p_exposure.apply(p);
                    r += val;
                    g += val;
                    b += val;
                }
            }

            // r *= 255;
            // g *= 255;
            // b *= 255;

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
        ctx.putImageData(id, 0, 0);

    }

    // Render velocity arrows
    if (render_velocity) {

        for (var i = 0; i < fluid.size_x; i++) {
            for (var j = 0; j < fluid.size_y; j++) {
                // var render_velocitiy_lines = true;
                ctx.lineWidth = 1;
                ctx.beginPath();

                var start_x = (i + 0.5) * canvas.width / fluid.size_x;
                var start_y = (j + 0.5) * canvas.height / fluid.size_y;
                var end_x = start_x + fluid.u[i * n + j];
                var end_y = start_y + fluid.v[i * n + j];

                // Draw arrow line
                ctx.moveTo(start_x, start_y);
                ctx.lineTo(end_x, end_y);
                ctx.stroke();

                // // Draw arrow head
                // const arrow_size = 4;
                // const angle = Math.atan2(end_y - start_y, end_x - start_x);
                // ctx.beginPath();
                // ctx.moveTo(end_x, end_y);
                // ctx.lineTo(
                //     end_x - arrow_size * Math.cos(angle - Math.PI / 6),
                //     end_y - arrow_size * Math.sin(angle - Math.PI / 6)
                // );
                // ctx.lineTo(
                //     end_x - arrow_size * Math.cos(angle + Math.PI / 6),
                //     end_y - arrow_size * Math.sin(angle + Math.PI / 6)
                // );
                // ctx.closePath();
                // ctx.fill()

            }
        }
    }

}

