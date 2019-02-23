var bot = {
    last_y: null,
    
    target_ammo: null,
    
    update: function() {
        if (player.y == player.offset_y) {
            keys.up   = false;
            keys.down = true;
        }
        
        if (player.y == height - player.offset_y) {
            keys.down = false;
            keys.up   = true;
        }
        
        //get the monsters whose y values are within 15 of the player's x
        if (monsters.filter((m) => {
            if (Math.abs(m.y - player.y) < m.offset / 2) {
                return true;
            } else {
                return false;
            }
        }).length > 0 && Math.abs(this.last_y - player.y) > 2 * player.offset_y) {
            player.fire();
            this.last_y = player.y;
        }
        
        if (this.target_ammo == null && objects.length > 0) {
            //pick a target box to pick up
            if (keys.up) {
                //match the x of one that's above the bot
                var targets = objects.filter((o) => {
                    return o.y < player.y;
                });
                
                //find the one with the smallest y
                targets.sort((a, b) => { return a.y - b.y; });
                
                this.target_ammo = targets[0];
            } else {
                //the bot is moving down
                var targets = objects.filter((o) => {
                    return o.y > player.y;
                });
                
                //find the one with the smallest y
                targets.sort((a, b) => { return b.y - a.y; });
                
                this.target_ammo = targets[0];
            }
        }
        
        if (this.target_ammo != null) {
            //matches the target's x?
            if (Math.abs(this.target_ammo.x - player.x) < player.offset_x) {
                //matches, clear left and right vectors
                keys.left  = false;
                keys.right = false;
            } else if (this.target_ammo.x < player.x) {
                //move to the left
                keys.right = false;
                keys.left  = true;
            } else if (this.target_ammo.x > player.x) {
                keys.right = true;
                keys.left  = false;
            }
            
            if (!this.target_ammo.active) {
                //set the target to null
                this.target_ammo = null;
            }
        }
    },
    
    init: function() {
        keys.down   = true;
        this.last_y = player.y;
    },
};