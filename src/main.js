let Traveler = require('./Traveler');

let Mayor = require('./town_mayor');

module.exports.loop = function() {
    //Memory management
    for(let name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    for (let room in Game.rooms) {
        const mayor = new Mayor(Game.rooms[room]);
        mayor.main();
    }
};