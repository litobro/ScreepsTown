function Powerplant(room){
    this.room = room;
    this.targets = this.room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_SPAWN || STRUCTURE_EXTENSION || STRUCTURE_CONTAINER}});

    // Will eventually want to findClosestByPath of non full target
    this.getDepositTarget = function(){
        return this.targets[0];
    };

    // Will eventually want to findClosestByPath of full or partially full target
    this.getWithdrawTarget = function() {
        return this.targets[0];
    };
}

module.exports = Powerplant;