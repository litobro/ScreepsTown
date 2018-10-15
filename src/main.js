let roleHarvester = require('./role.harvester');
let roleUpgrader = require('./role.upgrader');
let roleBuilder = require('./role.builder');

module.exports.loop = function() {
    //Memory management
    for(let name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Deleting non-existent creep from memory:', name);
        }
    }
    
    let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    console.log('Harvester Count:', harvesters.length);
    if(harvesters.length < 2) {
        let newName = 'Harvester' + Game.time;
        console.log('Spawning Harvester:', newName);
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: 'harvester'}});
    }
    
    let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
    console.log('Upgrader Count:', upgraders.length);
    if(upgraders.length < 2) {
        let newName='Upgrader' + Game.time;
        console.log('Spawning Upgrader:', newName);
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], newName, {memory: {role: 'upgrader', upgrading: true}});
    }

    let builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    console.log('Builder Count:', builders.length);
    if(builders.length < 1) {
        let newName='Builder' + Game.time;
        console.log('Spawning Builder:', newName);
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], newName, {memory: {role: 'builder'}});
    }
    
    if(Game.spawns['Spawn1'].spawning) {
        let spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
        Game.spawns['Spawn1'].visual.text(spawningCreep.memory.role)
    }
    
    for(let name in Game.creeps) {
        let creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
    }
}