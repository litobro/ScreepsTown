const Miner = {
    get_body_parts: function(room) {
        return [WORK, CARRY, MOVE];
    },
    role: 'miner',
    run: function(creep, source, target) {
        if(creep.carry.energy < creep.carryCapacity) {
            if(creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.travelTo(source);
            }
        }
        else {
            if(creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.travelTo(target);
            }
        }
    },
};

module.exports = Miner;