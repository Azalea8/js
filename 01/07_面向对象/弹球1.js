class Quadtree {
    constructor(x, y, w, h, depth = 0, maxDepth = 4, maxObjects = 4) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.depth = depth;
        this.maxDepth = maxDepth;
        this.maxObjects = maxObjects;

        this.objects = [];
        this.nodes = null;
    }

    split() {
        const subWidth = this.w / 2;
        const subHeight = this.h / 2;
        const x = this.x;
        const y = this.y;

        this.nodes = [
            new DynamicQuadtree(x + subWidth, y, subWidth, subHeight),
            new DynamicQuadtree(x, y, subWidth, subHeight),
            new DynamicQuadtree(x, y + subHeight, subWidth, subHeight),
            new DynamicQuadtree(x + subWidth, y + subHeight, subWidth, subHeight),
        ];
    }

    getIndex(obj) {
        const verticalMidpoint = this.x + this.w / 2;
        const horizontalMidpoint = this.y + this.h / 2;

        const topQuadrant = obj.y + obj.radius < horizontalMidpoint;
        const bottomQuadrant = obj.y - obj.radius > horizontalMidpoint;

        let index = -1;

        if (obj.x + obj.radius < verticalMidpoint) {
            if (topQuadrant) {
                index = 1;
            } else if (bottomQuadrant) {
                index = 2;
            }
        } else if (obj.x - obj.radius > verticalMidpoint) {
            if (topQuadrant) {
                index = 0;
            } else if (bottomQuadrant) {
                index = 3;
            }
        }

        return index;
    }

    insert(obj) {
        if (this.nodes) {
            const index = this.getIndex(obj);
            if (index !== -1) {
                this.nodes[index].insert(obj);
                return;
            }
        }

        this.objects.push(obj);

        if (this.objects.length > this.maxObjects && this.depth < this.maxDepth) {
            if (!this.nodes) {
                this.split();
            }

            let i = 0;
            while (i < this.objects.length) {
                const index = this.getIndex(this.objects[i]);
                if (index !== -1) {
                    this.nodes[index].insert(this.objects.splice(i, 1)[0]);
                } else {
                    i++;
                }
            }
        }
    }

    retrieve(obj, found) {
        const index = this.getIndex(obj);
        if (index !== -1 && this.nodes) {
            this.nodes[index].retrieve(obj, found);
        }

        found.push(...this.objects);

        return found;
    }

    update(obj) {
        if (!this.contains(obj)) {
            this.remove(obj);
            this.insert(obj);
        }
    }

    remove(obj) {
        const index = this.objects.indexOf(obj);
        if (index !== -1) {
            this.objects.splice(index, 1);
        } else if (this.nodes) {
            const index = this.getIndex(obj);
            if (index !== -1) {
                this.nodes[index].remove(obj);
            }
        }
    }

    clear() {
        this.objects = [];

        if (this.nodes) {
            for (const node of this.nodes) {
                node.clear();
            }
        }

        this.nodes = null;
    }

    contains(obj) {
        return obj.x >= this.x && obj.y >= this.y && obj.x + obj.radius <= this.x + this.w && obj.y + obj.radius <= this.y + this.h;
    }
}

class Circle {
    constructor(x, y, radius, vx, vy) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.color = this.getRandomColor();
        this.nodes = new Set();
    }

    getRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgb(${r}, ${g}, ${b})`;
    }

    move(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.vx = -this.vx;
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.vy = -this.vy;
        }
        for (const node of this.nodes) {
            node.update(this);
        }
    }

    collidesWith(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);
        return distance <= this.radius + other.radius;
    }
}

class DynamicQuadtree extends Quadtree {
    constructor(x, y, w, h) {
        super(x, y, w, h);
    }

    updateAll() {
        for (const obj of this.objects) {
            this.remove(obj);
            this.insert(obj);
        }

        if (this.nodes) {
            for (const node of this.nodes) {
                node.updateAll();
            }
        }
    }

    query(obj, found) {
        const index = this.getIndex(obj);
        if (index !== -1 && this.nodes) {
            this.nodes[index].query(obj, found);
        }

        for (const other of this.objects) {
            if (other !== obj && obj.collidesWith(other)) {
                found.add(other);
            }
        }

        return found;
    }
}

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;

const qt = new DynamicQuadtree(0, 0, canvas.width, canvas.height);
const circles = [];
for (let i = 0; i < 300; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 10 + 10;
    const vx = (Math.random() - 0.5) * 1000;
    const vy = (Math.random() - 0.5) * 1000;
    const circle = new Circle(x, y, radius, vx, vy);
    circles.push(circle);
    qt.insert(circle);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const circle of circles) {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
        ctx.fillStyle = circle.color;
        ctx.fill();
    }
}

function update(dt) {
    for (const circle of circles) {
        circle.move(dt);
    }

    const found = new Set();
    for (const circle of circles) {
        qt.query(circle, found);
        for (const other of found) {
            if (circle !== other && circle.collidesWith(other)) {
                const color = circle.getRandomColor();
                circle.color = color;
                other.color = color;
            }
        }
        found.clear();
    }

    qt.updateAll();
}

let lastTime = performance.now();

function loop() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

loop();
