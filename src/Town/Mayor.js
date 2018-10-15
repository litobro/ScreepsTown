class Mayor {
    roomName = '';
    taskQueue = [];

    Mayor: function (roomName) {
        this.roomName = roomName;
    };

    Init: function () {
        Console.log('Mayor initialized for: ', this.roomName);
    };
};

module.exports(Mayor);