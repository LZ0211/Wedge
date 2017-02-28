const setting = require("./setting");

module.exports = function (electron){
    const BrowserWindow = electron.BrowserWindow;
    let mainWindow;
    mainWindow = new BrowserWindow(setting);
    mainWindow.loadURL(`file://${__dirname}/index.html`);
    mainWindow.on('closed', function () {
        mainWindow = null
    });
}
