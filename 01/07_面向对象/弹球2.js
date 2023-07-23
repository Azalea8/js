const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// 设置画布大小
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 定义圆形类
class Circle {
    constructor(x, y, r, color) {
        this.x = x; // 圆心横坐标
        this.y = y; // 圆心纵坐标
        this.r = r; // 半径
        this.color = color; // 颜色
        this.vx = Math.random() * 10 - 5; // 横向速度
        this.vy = Math.random() * 10 - 5; // 纵向速度
    }

    // 绘制圆形
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    // 更新圆形位置
    update() {
        this.x += this.vx;
        this.y += this.vy;

        // 撞到画布边缘时反弹
        if (this.x - this.r < 0 || this.x + this.r > canvas.width) {
            this.vx = -this.vx;
        }
        if (this.y - this.r < 0 || this.y + this.r > canvas.height) {
            this.vy = -this.vy;
        }
    }
}

// 动态四叉树类
class QuadTree {
    constructor(boundary, capacity) {
        this.boundary = boundary; // 区域范围
        this.capacity = capacity; // 容量
        this.points = []; // 区域内的圆形
        this.subtrees = []; // 子树
    }

    // 判断圆形是否在区域内
    contains(circle) {
        return (
            circle.x >= this.boundary.x &&
            circle.x - circle.r <= this.boundary.x + this.boundary.w &&
            circle.y >= this.boundary.y &&
            circle.y - circle.r <= this.boundary.y + this.boundary.h
        );
    }

    // 将圆形添加到四叉树
    insert(circle) {
        if (!this.contains(circle)) {
            return false;
        }

        if (this.points.length < this.capacity) {
            this.points.push(circle);
            return true;
        }

        if (!this.subtrees.length) {
            this.subdivide();
        }

        for (const subtree of this.subtrees) {
            if (subtree.insert(circle)) {
                return true;
            }
        }
    }

    // 绘制四叉树
    draw() {
        ctx.strokeStyle = 'white';
        ctx.strokeRect(this.boundary.x, this.boundary.y, this.boundary.w, this.boundary.h);

        for (const subtree of this.subtrees) {
            subtree.draw();
        }
    }

    // 子分区
    subdivide() {
        const { x, y, w, h } = this.boundary;
        const nw = new Boundary(x, y, w / 2, h / 2);
        const ne = new Boundary(x + w / 2, y, w / 2, h / 2);
        const sw = new Boundary(x, y + h / 2, w / 2, h / 2);
        const se = new Boundary(x + w / 2, y + h / 2, w / 2, h / 2);

        this.subtrees.push(new QuadTree(nw, this.capacity));
        this.subtrees.push(new QuadTree(ne, this.capacity));
        this.subtrees.push(new QuadTree(sw, this.capacity));
        this.subtrees.push(new QuadTree(se, this.capacity));
    }

    // 获取所有可能碰撞的圆形对
    getCollisions() {
        let collisions = [];

        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                if (this.points[i].color === this.points[j].color) {
                    continue;
                }

                const distance = Math.sqrt(
                    (this.points[i].x - this.points[j].x) ** 2 + (this.points[i].y - this.points[j].y) ** 2
                );

                if (distance <= this.points[i].r + this.points[j].r) {
                    collisions.push([this.points[i], this.points[j]]);
                }
            }
        }

        for (const subtree of this.subtrees) {
            collisions = collisions.concat(subtree.getCollisions());
        }

        return collisions;
    }
}

// 定义区域范围类
class Boundary {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

// 创建动态四叉树实例
const quadTree = new QuadTree(new Boundary(0, 0, canvas.width, canvas.height), 4);

// 创建圆形数组
const circles = [];
for (let i = 0; i < 50; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 30 + 10;
    const color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
    const circle = new Circle(x, y, r, color);
    circles.push(circle);
}

// 动画循环
function animate() {
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 更新所有圆形位置并绘制
    for (const circle of circles) {
        circle.update();
        circle.draw();

        // 将圆形添加到四叉树
        quadTree.insert(circle);
    }

    // 获取所有可能碰撞的圆形对
    const collisions = quadTree.getCollisions();

    // 处理碰撞
    for (const [circle1, circle2] of collisions) {
        const color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
        circle1.color = color;
        circle2.color = color;
    }

    // 绘制四叉树
    // quadTree.draw();

    // 递归调用动画循环
    requestAnimationFrame(animate);
}

// 开始动画循环
animate();
