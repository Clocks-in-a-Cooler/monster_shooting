
var start_button;
var overlay, overlay_opacity;
var start_game_screen, start_screen_opacity;
var end_game_screen, end_screen_opacity;
var score_counter;

var canvas;
var context;
var width, height;

function init() {
    //set up the various elements
    overlay           = document.getElementById("overlay");
    start_game_screen = document.getElementById("start-screen");
    start_button      = document.querySelector("button");
    end_game_screen   = document.getElementById("game-over");
    score_counter     = document.getElementById("score-counter");
    
    overlay_opacity      = 1;
    start_screen_opacity = 1;
    end_screen_opacity   = 0;
    
    canvas  = document.querySelector("canvas");
    context = canvas.getContext("2d");
    
    canvas.width  = width  = window.innerWidth;
    canvas.height = height = window.innerHeight;
    
    //set up an event listener on the start button
    start_button.addEventListener("click", start_game);
    
    status = "pregame";
}

function start_game() {
    //remove the event listener from the start button
    start_button.removeEventListener("click", start_game);
    
    //set up the player and stuff
    player.x      = 30;
    player.y      = height / 2;
    player.health = 15;
    player.ammo   = 20;
    
    //set up the event handlers
    addEventListener("keydown", keydown);
    addEventListener("keyup", keyup);
    
    requestAnimationFrame(animate);
}

function end_game() {
    status = "game over";
    
    score_counter.innerHTML = "game over.\nscore: " + score;
}

// event handlers --------------------------------------------------------------
var keys = {
    up: false,
    down: false,
    left: false,
    right: false,
};

/* keycodes
 * w: 87, a: 65, s: 83, d: 68
 * left: 37, up: 38, right: 39, down: 40
 * space: 32, shift: 16, p: 80
 */
function keydown(e) {
    e.preventDefault();
    switch (e.keyCode) {
        case 38:
        case 87:
            keys.up = true;
            break;
        case 40:
        case 83:
            keys.down = true;
            break;
        case 37:
        case 65:
            keys.left = true;
            break;
        case 39:
        case 68:
            keys.right = true;
            break;
    }
}

function keyup(e) {
    switch (e.keyCode) {
        case 38:
        case 87:
            keys.up = false;
            break;
        case 40:
        case 83:
            keys.down = false;
            break;
        case 37:
        case 65:
            keys.left = false;
            break;
        case 39:
        case 68:
            keys.right = false;
            break;
        case 80:
            paused = !paused;
            break;
        case 32:
            player.fire();
            break;
    }
}

//data for the game ------------------------------------------------------------

var score = 0;

var monsters = [];
var bullets  = [];
var objects  = [];
var texts    = [];
var player   = {
    x: null,
    y: null,
    ammo: null,
    health: null,
    speed: 0.2,
    
    //animation related
    pose: 0,
    move_time: 0,
    pose_delay: 250,
    
    offset_x: 8,
    offset_y: 15,
    
    fire: function() {
        if (this.ammo > 0) {
            bullets.push(new Bullet(this.x + this.offset_x, this.y));
            this.ammo--;
        } else {
            texts.push(new Text("no ammo!", this.x, this.y, 1500, {r: 255, g: 140, b: 0}));
        }
    },
    
    collision: function(h) {
        this.health -= h == undefined ? 1 : h;
    },
    
    update: function(lapse) {
        var vx = 0, vy = 0;
        
        vx += keys.left ? -1 : 0;
        vx += keys.right ? 1 : 0;
        vy += keys.up ? -1 : 0;
        vy += keys.down ? 1 : 0;
        
        this.x += vx * this.speed * lapse;
        this.y += vy * this.speed * lapse;
        
        //keep the player within bounds
        this.x = Math.max(this.x, this.offset_x);
        this.x = Math.min(this.x, 200 - this.offset_x);
        this.y = Math.max(this.y, this.offset_y);
        this.y = Math.min(this.y, height - this.offset_y);
        
        //update the pose, if necessary
        if (keys.left || keys.right || keys.up || keys.down) {
            this.move_time += lapse;
            
            if (Math.floor(this.move_time / this.pose_delay) % 2 == 0) {
                this.pose = 2;
            } else {
                this.pose = 1;
            }
        } else {
            this.move_time = 0;
            this.pose      = 0;
        }
        
        if (this.health <= 0) {
            end_game();
        }
    },
};

// various types ---------------------------------------------------------------
//bullets
function Bullet(x, y) {
    this.x = x;
    this.y = y;
    
    this.active = true;
}

Bullet.prototype.speed = 0.3;

Bullet.prototype.update = function(lapse) {
    this.x += lapse * this.speed;
    
    if (this.x > width) {
        this.active = false;
    }
};

Bullet.prototype.collision = function() {
    this.active = false;
};

//monster
function Monster(x, y) {
    this.x = x;
    this.y = y;
    
    this.speed = 0.025 + Math.random() * 0.025;
    
    this.pose      = 0;
    this.pose_time = 0;
    
    this.lifetime = 0;
    this.active   = true;
}

Monster.prototype.pose_delay = 167;
Monster.prototype.offset     = 15;

Monster.prototype.update = function(lapse) {
    //monsters move toward the left
    this.x -= lapse * this.speed;
    
    var a = bullets.filter((b) => {
        return (
            b.x > this.x - this.offset &&
            b.y > this.y - this.offset &&
            b.x < this.x + this.offset &&
            b.y < this.y + this.offset
        );
    });
    
    if (a.length > 0) {
        a.forEach((b) => {
            b.collision();
        });
        
        score++;
        
        if (Math.random() < 0.15) {
            objects.push(new Ammo_box(
                Math.random() * 200,
                Math.random() * height
            ));
        } else if (Math.random() < 1 / 17) {
            objects.push(new Health_box(
                Math.random() * 200,
                Math.random() * height
            ));
        }
        
        this.active = false;
    }
    
    if (
        Math.abs(player.x - this.x) < this.offset + player.offset_x &&
        Math.abs(player.y - this.y) < this.offset + player.offset_y
    ) {
        texts.push(new Text("-1 health", this.x, this.y, 1500, {r: 220, g: 20, b: 60}));
        player.collision();
        this.active = false;
    }
    
    if (this.x < 0) {
        this.active = false;
        score -= 10;
    }
    
    //now update the pose
    this.pose_time += lapse;
    if (this.pose_time >= this.pose_delay) {
        this.pose_time = 0;
        this.pose++;
        this.pose = this.pose % 4;
    }
};

//bigger monster!
function Big_monster(x, y) {
    this.x = x; this.y = y;
    
    this.health    = this.max_health;
    this.pose      = 0;
    this.pose_time = 0;
    this.active    = true;
}

Big_monster.prototype.speed      = 0.01;
Big_monster.prototype.pose_delay = 167;
Big_monster.prototype.offset     = 30;
Big_monster.prototype.max_health = 15;

Big_monster.prototype.update = function(lapse) {
    this.pose_time += lapse;
    if (this.pose_time >= this.pose_delay) {
        this.pose_time = 0;
        this.pose++;
        this.pose = this.pose % 4;
    }
    
    this.x -= this.speed * lapse;
    
    //check for bullet collision
    var blt = bullets.filter((b) => {
        return (b.x > this.x - this.offset &&
            b.x < this.x + this.offset &&
            b.y > this.y - this.offset &&
            b.y < this.y + this.offset);
    });
    
    if (blt.length > 0) {
        this.health--;
        
        if (this.health <= 0) {
            this.active = false;
            score += 25;
            
            //spawn three boxes to reward the player
            objects.push(new Ammo_box(Math.random() * 200, Math.random() * height));
            objects.push(new Ammo_box(Math.random() * 200, Math.random() * height));
            objects.push(new Ammo_box(Math.random() * 200, Math.random() * height));
            objects.push(new Health_box(Math.random() * 200, Math.random() * height));
        }
        
        blt.forEach((b) => { b.collision(); });
    }
    
    //check for player collision
    if (
        Math.abs(this.x - player.x) < this.offset + player.offset_x &&
        Math.abs(this.y - player.y) < this.offset + player.offset_y
    ) {
        player.health -= this.health;
        texts.push(new Text("-" + this.health + " health", this.x, this.y, 1500, { r: 220, g: 20, b: 60 }));
        this.active = false;
    }
};

var spawn_time = null;

function spawn_monster(time) {
    if (Math.random() < 0.1 && score > 50) {
        monsters.push(new Big_monster(width, 30 + Math.random() * (height - 60)));
    } else {
        monsters.push(new Monster(width, 15 + Math.random() * (height - 30)));
    }
    
    spawn_time = time + Math.random() * 1500;
}

//ammo box
function Ammo_box(x, y) {
    this.x = x;
    this.y = y;
    
    this.active = true;
}

Ammo_box.prototype.offset = 10;

Ammo_box.prototype.update = function(lapse) {
    //doesn't move. i'd be scared if it does.
    
    //does check for collision with the player, though.
    if (
        this.x > player.x - this.offset - player.offset_x &&
        this.y > player.y - this.offset - player.offset_y &&
        this.x < player.x + this.offset + player.offset_x &&
        this.y < player.y + this.offset + player.offset_y
    ) {
        this.active = false;
        player.ammo += 10;
        texts.push(new Text("+10 ammo", this.x, this.y, 1500));
    }
};

//health box
function Health_box(x, y) {
    this.x = x;
    this.y = y;
    
    this.active = true;
}

Health_box.prototype.offset = 10;

Health_box.prototype.update = function(lapse) {
    if (
        this.x > player.x - this.offset - player.offset_x &&
        this.y > player.y - this.offset - player.offset_y &&
        this.x < player.x + this.offset + player.offset_x &&
        this.y < player.y + this.offset + player.offset_y
    ) {
        this.active = false;
        if (player.health <= 13) {
            player.health += 2;
            texts.push(new Text("+2 health", this.x, this.y, 1500, {r: 0, g: 255, b: 127}));
        } else {
            player.ammo += 10;
            texts.push(new Text("+10 ammo", this.x, this.y, 1500));
        }
    }
}

function Text(text, x, y, lifetime, colour) {
    //text: 8 pixels per character in Arial at 12 pts
    //so for 16pt, it's about 11 pixels per character
    this.text = text;
    
    this.x = x - (text.length / 2) * 11;
    this.y = y;
    
    this.lifetime = lifetime;
    this.life     = 0;
    this.active   = true;
    
    if (colour) {
        this.r = colour.r;
        this.g = colour.g;
        this.b = colour.b;
    } else {
        this.r = 186;
        this.g = 85;
        this.b = 211;
    }
    this.alpha = 1;
}

Text.prototype.update = function(lapse) {
    this.life += lapse;
    
    this.y -= lapse * 0.05;
    
    this.alpha = 1 - (this.life / this.lifetime);
    
    if (this.life >= this.lifetime) {
        this.active = false;
    }
};

// animation loop --------------------------------------------------------------
var last_time = null, lapse = 0;
var paused    = false;
var status    = "";

function animate(time) {
    if (last_time == null) {
        lapse = 0;
    } else {
        lapse = time - last_time;
    }
    last_time = time;
    
    if (!paused && (status == "playing" || status == "pregame")) {
        cycle(lapse);
        
        if (spawn_time == null) {
            spawn_time = time;
            spawn_monster(time);
        } else if (spawn_time < time) {
            spawn_monster(time);
        }
    }
    
    if (status == "pregame") {
        //the screens will take 1.5 seconds to fade. that's 0.006 per 10 ms
        overlay_opacity      -= (lapse / 10) * 0.006;
        start_screen_opacity -= (lapse / 10) * 0.006;
        
        overlay.style.opacity           = overlay_opacity;
        start_game_screen.style.opacity = start_screen_opacity;
        
        if (start_screen_opacity < 0) { //they'll disappear
            overlay.style.visibility        = "hidden";
            overlay_opacity                 = 0;
            start_game_screen.style.opacity = "hidden";
            start_screen_opacity            = 0;
            
            status = "playing";
        }
    }
    
    if (status == "game over") {
        overlay_opacity    += (lapse / 10) * 0.006;
        end_screen_opacity += (lapse / 10) * 0.006;
        
        end_game_screen.style.visibility = "visible";
        overlay.style.visibility         = "visible";
        
        overlay.style.opacity         = overlay_opacity;
        end_game_screen.style.opacity = end_screen_opacity;
        
        if (end_screen_opacity > 1) { //they'll appear
            overlay_opacity    = 1;
            end_screen_opacity = 1;
            
            overlay.style.opacity         = overlay_opacity;
            end_game_screen.style.opacity = end_screen_opacity;
            
            status = "";
        }
    }
    
    draw_frame();
    requestAnimationFrame(animate);
}

function cycle(lapse) {
    //updates everything
    player.update(lapse);
    
    //filter stuff
    bullets  = bullets.filter((b) => { return b.active; });
    monsters = monsters.filter((m) => { return m.active; });
    objects  = objects.filter((o) => { return o.active; });
    texts    = texts.filter((t) => { return t.active; });
    
    bullets.forEach((b) => { b.update(lapse); });
    monsters.forEach((m) => { m.update(lapse); });
    objects.forEach((o) => { o.update(lapse); });
    texts.forEach((t) => { t.update(lapse); });
}

// sprites ---------------------------------------------------------------------
var player_sprite = (function() {
    var elt = document.createElement("img");
    elt.src = "sprites/player.png";
    return elt;
})();

var player_sprite_width = 10, player_sprite_height = 15;

var bullet_sprite = (function() {
    var elt = document.createElement("img");
    elt.src = "sprites/bullet.png";
    return elt;
})();

var monster_sprite = (function() {
    var elt = document.createElement("img");
    elt.src = "sprites/monster.png";
    return elt;
})();

var big_monster_sprite = (function() {
    var elt = document.createElement("img");
    elt.src = "sprites/big_monster.png"
    return elt;
})();

var crate_sprite = (function() {
    var elt = document.createElement("img");
    elt.src = "sprites/crates.png";
    return elt;
})();

// drawing ---------------------------------------------------------------------
function draw_frame() {
    context.clearRect(0, 0, width, height);
    
    //draw the line
    context.strokeStyle = "lightslategray";
    context.beginPath();
    context.moveTo(200, 0);
    context.lineTo(200, height);
    context.closePath();
    context.stroke();
    
    //draw the player
    context.drawImage(
        player_sprite,
        0, 2 * player_sprite_height * player.pose,
        20, 2 * player.offset_y,
        player.x - player.offset_x,
        player.y - player.offset_y,
        20, 2 * player.offset_y
    );
    
    //draw bullets
    bullets.forEach((b) => {
        context.drawImage(bullet_sprite, b.x - 3, b.y - 2);
    });
    
    //draw monsters
    monsters.forEach((m) => {
        if (m instanceof Monster) {
            context.drawImage(
                monster_sprite,
                0, 2 * m.offset * m.pose,
                2 * m.offset, 2 * m.offset,
                m.x - m.offset, m.y - m.offset,
                2 * m.offset, 2 * m.offset
            );
        }
        
        if (m instanceof Big_monster) {
            context.drawImage(
                big_monster_sprite,
                0, 2 * m.offset * m.pose,
                2 * m.offset, 2* m.offset,
                m.x - m.offset, m.y -m.offset,
                2 * m.offset, 2 * m.offset
            );
            //then draw its health bar
            context.fillStyle = "mediumspringgreen";
            context.fillRect(
                m.x - m.offset, m.y - m.offset - 8,
                m.health * 4 , 5
            );
            context.fillStyle = "darkkhaki";
            context.fillRect(
                m.x - m.offset + m.health * 4, m.y - m.offset - 8,
                (m.max_health - m.health) * 4, 5
            );
        }
    });
    
    //draw ammo boxes
    objects.forEach((o) => {
        if (o instanceof Ammo_box) {
            context.drawImage(crate_sprite, 0, 0, 20, 20,
                o.x - o.offset, o.y - o.offset, o.offset * 2, o.offset * 2);
        }
        
        if (o instanceof Health_box) {
            context.drawImage(crate_sprite, 0, 20, 20, 20,
                o.x - o.offset, o.y - o.offset, o.offset * 2, o.offset * 2);
        }
    });
    
    //draw the texts
    texts.forEach((t) => {
        context.font      = "14pt Arial";
        context.fillStyle = "rgba("+ t.r + ", " + t.g + ", " + t.b + ", " + t.alpha + ")";
        context.fillText(t.text, t.x, t.y);
    });
    
    //draw the ammo counter
    context.fillStyle = "royalblue";
    context.font      = "12pt Arial";
    context.fillText(
        ((player.ammo == 0 && objects.length == 0 && bullets.length == 0) ?
        "no ammo? you're screwed!" :
        "ammo: " + player.ammo),
        5, 30);
    context.fillText(
        (player.health > 0 ? "health: " + player.health : "you're dead!"),
        5, 50);
    context.fillText("score: " + score, 5, 70);
}