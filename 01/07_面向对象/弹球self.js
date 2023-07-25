const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

class Circle {
    constructor(x, y, radius, vx, vy) {
        this.x = x
        this.y = y
        this.radius = radius
        this.vx = vx
        this.vy = vy
        this.color = this.randomColor()
    }

    randomColor() {
        const R = Math.floor(Math.random() * 256)
        const G = Math.floor(Math.random() * 256)
        const B = Math.floor(Math.random() * 256)
        return `rgb(${R}, ${G}, ${B})`
    }

    move() {
        if (this.x + this.radius >= width || this.x - this.radius <= 0) {
            this.vx = -this.vx
        }
        if (this.y + this.radius >= height || this.y - this.radius <= 0) {
            this.vy = -this.vy
        }

        this.x += this.vx
        this.y += this.vy
    }

    collidesWith(other) {
        const dx = this.x - other.x
        const dy = this.y - other.y
        const distance = Math.sqrt(dx ** 2 + dy ** 2)
        return distance < this.radius + other.radius
    }
}

class PlaneTree {
    constructor(plane, maxObjects = 4) {
        this.plane = plane
        this.maxObjects = maxObjects

        this.objects = []
        this.nodes = null
    }

    spilt() {
        const subWidth = this.plane.width / 2
        const subHeight = this.plane.height / 2
        const x = this.plane.x
        const y = this.plane.y

        this.nodes = [
            new PlaneTree({x: x, y: y, width: subWidth, height: subHeight}),
            new PlaneTree({x: x + subWidth, y: y, width: subWidth, height: subHeight}),
            new PlaneTree({x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight}),
            new PlaneTree({x: x, y: y + subHeight, width: subWidth, height: subHeight})
        ]
    }

    getIndex(obj) {
        const x_mid = this.plane.x + this.plane.width / 2
        const y_mid = this.plane.y + this.plane.height / 2

        const top = obj.y + obj.radius <= y_mid
        const bottom = obj.y - obj.radius >= y_mid
        const left = obj.x + obj.radius <= x_mid
        const right = obj.x - obj.radius >= x_mid


        let index = -1

        if (top && left) index = 0
        else if (top && right) index = 1
        else if (bottom && right) index = 2
        else if (bottom && left) index = 3

        return index
    }

    insert(obj) {
        if (this.nodes) {
            const index = this.getIndex(obj)
            if (index !== -1) {
                this.nodes[index].insert(obj)
                return
            }
        }

        this.objects.push(obj)

        if (this.objects.length > this.maxObjects) {
            if (!this.nodes) {
                // console.log('平面树自动分裂, 元素向下蔓延')
                this.spilt()
            }

            let i = 0
            while (i < this.objects.length) {
                const index = this.getIndex(this.objects[i])
                if (index !== -1) {
                    // console.log(index, '下一层插入')
                    this.nodes[index].insert(this.objects.splice(i, 1)[0])
                } else {
                    // console.log('留在本层')
                    i++
                }
            }
        }
    }

    clear() {
        this.objects = []

        if (this.nodes) {
            for (const node of this.nodes) {
                node.clear()
            }
        }

        this.nodes = null
    }

    query(obj, found) {
        const index = this.getIndex(obj)
        if (index !== -1 && this.nodes) {
            this.nodes[index].query(obj, found)
        }

        for (const other of this.objects) {
            if (other !== obj && obj.collidesWith(other)) {
                // console.log(other)
                found.add(other)
            }
        }
        return found
    }

    draw() {
        ctx.strokeStyle = 'white'
        ctx.strokeRect(this.plane.x, this.plane.y, this.plane.width, this.plane.height);

        if (this.nodes) {
            for (const node of this.nodes) {
                node.draw()
            }
        }
    }
}

const circles = [];
const qt = new PlaneTree({x: 0, y: 0, width: width, height: height});

for (let i = 0; i < 10000; i++) {
    const radius = getRndInteger(1, 1)
    const x = getRndInteger(radius, width - radius)
    const y = getRndInteger(radius, height - radius)
    const vx = getRndInteger(-3, 3)
    const vy = getRndInteger(-3, 3)
    const circle = new Circle(x, y, radius, vx, vy)
    circles.push(circle)
}

function draw() {
    ctx.fillStyle = `rgba(0, 0, 0, 0.3)`
    ctx.fillRect(0, 0, width, height);
    for (const circle of circles) {
        ctx.beginPath()
        ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI)
        ctx.fillStyle = circle.color
        ctx.fill()
    }
}

function updateAll() {
    for (const circle of circles) {
        circle.move();
    }

    const found = new Set()
    for (const circle of circles) {
        qt.query(circle, found)

        let flag = false
        for (const other of found) {
            flag = true
            circles.splice(circles.indexOf(other), 1)
        }
        if (flag) {
            circles.splice(circles.indexOf(circle), 1)
        }

        found.clear()
    }

    // console.log('小球数量为：', circles.length)
    qt.clear()
    for (const circle of circles) {
        qt.insert(circle)
    }
}

function start() {
    updateAll()
    draw()

    qt.draw()
    requestAnimationFrame(start)
}

start()

