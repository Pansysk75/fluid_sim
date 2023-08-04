
const CellType = {
    empty: 0,
    reflector: 1,
    generator: 2,
    conductor: 3
}

class Wave {

    constructor(size_x, size_y) {
        this.size_x = size_x
        this.size_y = size_y

        this.num_cells = this.size_x * this.size_y;

        this.u = Array(this.num_cells).fill(0) // Posittion in z-direction
        this.v = Array(this.num_cells).fill(0) // Velocity in z-direction

        this.t = Array(this.num_cells).fill(CellType.empty) // Cell type
        this.p = Array(this.num_cells).fill(1.0) // Cell property (Real number whose interpretation depends on cell type)

        // for (var i = 0; i < this.size_x; i++) {
        //     for (var j = 0; j < this.size_y; j++) {
        //         if ((i == 0) || (i == (this.size_x - 1)) || (j == (this.size_y - 1)) || (j == 0)) {
        //             this.t[i * this.size_y + j] = CellType.reflector
        //             this.p[i * this.size_y + j] = 1.0;
        //         }
        //     }
        // }

    }

    solve_wave(dt) {
        const n = this.size_y;

        for (var i = 1; i < this.size_x - 1; i++) {
            for (var j = 1; j < this.size_y - 1; j++) {

                // We will use u as the position in the z-direction
                // and v as the speed in the z-direction
                // We shall accelerate every cell in the z-direction in proportion
                // to the second derivative in the x-y direction.

                if (this.t[i * n + j] == CellType.reflector) continue;
                if (this.t[i * n + j] == CellType.generator) {
                    var new_phase = (this.p[i * n + j] + 2 * Math.PI * dt) % (2 * Math.PI);
                    this.p[i * n + j] = new_phase;
                    this.v[i * n + j] = Math.sin(new_phase) / 10;
                    continue;
                }

                var a = 0

                if (i > 0 && i < this.size_x) {
                    a += (
                        this.v[(i - 1) * n + j] + this.v[(i + 1) * n + j] +
                        - 2 * this.v[i * n + j]);

                }
                if (j > 0 && j < this.size_y) {
                    a += (
                        this.v[i * n + j - 1] + this.v[i * n + j + 1]
                        - 2 * this.v[i * n + j]);
                }

                // a= (
                //     this.v[(i - 1) * n + j] + this.v[(i + 1) * n + j] +
                //     this.v[i * n + j - 1] + this.v[i * n + j + 1]
                //     - 4 * this.v[i * n + j]);

                var c = 10;

                // Apply the acceleration to the z-velocity
                this.u[i * n + j] += c * c * a * dt;
                // Apply velocity damping
                // this.u[i * n + j]  *= 0.95;
                this.u[i * n + j] *= Math.max(0, 1 - 3 * dt);
                // Update the position according to z-velocity
                this.v[i * n + j] += this.u[i * n + j] * dt;

            }
        }

        // for (var i = 0; i < this.size_x; i++) {
        //     this.v[i * n + 0] = this.v[i * n + 1];
        //     this.v[i * n + this.size_y - 1] = this.v[i * n + this.size_x - 2];
        // }
        // for (var j = 0; j < this.size_y; j++) {
        //     this.v[0 * n + j] = this.v[1 * n + j];
        //     this.v[(this.size_x - 1) * n + j] = this.v[(this.size_x - 2) * n + j];
        // }

    }

    set_cell(x, y, cell_type, cell_val) {
        if (x < 0 || x >= this.size_x ||
            y < 0 || y >= this.size_y) return;

        this.t[x * this.size_y + y] = cell_type;
        this.p[x * this.size_y + y] = cell_val;


    }

    get_u_at(x, y) {
        x = Math.max(Math.min(x, this.size_x - 1), 0);
        y = Math.max(Math.min(y, this.size_y - 1), 0);

        return this.u[x * this.size_y + y];
    }

    get_v_at(x, y) {
        x = Math.max(Math.min(x, this.size_x - 1), 0);
        y = Math.max(Math.min(y, this.size_y - 1), 0);

        return this.v[x * this.size_y + y]
    }

    update(dt) {
        this.solve_wave(dt);
    }

    get_cell_data(x, y) {

        if (x < 0 || x >= this.size_x ||
            y < 0 || y >= this.size_y) {
            return {};
        }

        var data = {};
        data['x'] = x;
        data['y'] = y;
        data["u"] = this.get_u_at(x, y);
        data["v"] = this.get_v_at(x, y);
        // const n = this.size_y;
        // data["s"] = this.s[x * n + y];
        return data;
    }
}

function to_scientific_color(val) {
    var val_min = -0.1
    var val_max = 0.1

    // Scale val from 0 to 1
    val = (val - val_min) / (val_max - val_min);
    val = Math.max(Math.min(val, 0.999), 0.001);

    var m = 0.25;
    var num = Math.floor(val / m);
    var s = (val - num * m) / m;
    var r, g, b;

    switch (num) {
        case 0: r = 0.0; g = s; b = 1.0; break;
        case 1: r = 0.0; g = 1.0; b = 1.0 - s; break;
        case 2: r = s; g = 1.0; b = 0.0; break;
        case 3: r = 1.0; g = 1.0 - s; b = 0.0; break;
    }

    return [255 * r, 255 * g, 255 * b]
}

function render_wave(canvas, wave) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    id = ctx.getImageData(0, 0, canvas.width, canvas.height)

    var r = 0
    var g = 0
    var b = 0

    const n = wave.size_y;

    for (var i = 0; i < wave.size_x; i++) {
        for (var j = 0; j < wave.size_y; j++) {

            r = 0
            g = 0
            b = 0

            var type = wave.t[i * n + j];
            if (type == CellType.empty) {
                vals = to_scientific_color(wave.v[i * n + j])
                r += vals[0];
                g += vals[1];
                b += vals[2];
            } else if (type == CellType.reflector) {
                r = 30;
                g = 30;
                b = 30;
            }

            var px_begin = Math.floor(i * canvas.width / wave.size_x)
            var px_end = Math.floor((i + 1) * canvas.width / wave.size_x)

            var py_begin = Math.floor(j * canvas.height / wave.size_y)
            var py_end = Math.floor((j + 1) * canvas.height / wave.size_y)

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

