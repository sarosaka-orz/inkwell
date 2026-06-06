const { app, BrowserWindow, Menu, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: '#f4efe6',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  buildMenu();
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Page',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.executeJavaScript('document.getElementById("bNew").click()'),
        },
        {
          label: 'Export HTML...',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => mainWindow?.webContents.executeJavaScript('document.getElementById("bEHtml").click()'),
        },
        {
          label: 'Export PDF...',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => mainWindow?.webContents.executeJavaScript('document.getElementById("bEPdf").click()'),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow?.webContents.executeJavaScript('document.getElementById("bSearch").click()'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Preview',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.executeJavaScript('document.getElementById("bPreview").click()'),
        },
        {
          label: 'Toggle Outline',
          accelerator: 'Alt+O',
          click: () => mainWindow?.webContents.executeJavaScript('document.getElementById("bOutline").click()'),
        },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+\\',
          click: () => mainWindow?.webContents.executeJavaScript('document.getElementById("bSidebar").click()'),
        },
        { type: 'separator' },
        {
          label: 'Zen Mode',
          accelerator: 'Alt+Z',
          click: () => mainWindow?.webContents.executeJavaScript('document.getElementById("bZen").click()'),
        },
        { type: 'separator' },
        {
          label: 'Toggle Theme',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => mainWindow?.webContents.executeJavaScript('document.getElementById("bTheme").click()'),
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'reload' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Format',
      submenu: [
        {
          label: 'Bold',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow?.webContents.executeJavaScript(`
            document.getElementById("editor").dispatchEvent(new KeyboardEvent('keydown', {key:'b', ctrlKey:true, bubbles:true}))
          `),
        },
        {
          label: 'Italic',
          accelerator: 'CmdOrCtrl+I',
          click: () => mainWindow?.webContents.executeJavaScript(`
            document.getElementById("editor").dispatchEvent(new KeyboardEvent('keydown', {key:'i', ctrlKey:true, bubbles:true}))
          `),
        },
        {
          label: 'Inline Code',
          accelerator: 'CmdOrCtrl+`',
          click: () => mainWindow?.webContents.executeJavaScript(`
            document.getElementById("editor").dispatchEvent(new KeyboardEvent('keydown', {key:'\`', ctrlKey:true, bubbles:true}))
          `),
        },
        {
          label: 'Link',
          accelerator: 'CmdOrCtrl+K',
          click: () => mainWindow?.webContents.executeJavaScript(`
            document.getElementById("editor").dispatchEvent(new KeyboardEvent('keydown', {key:'k', ctrlKey:true, bubbles:true}))
          `),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About inkwell',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About inkwell',
              message: 'inkwell v1.0.0',
              detail: 'A minimal markdown editor with Kyoto aesthetics.\n\nSupports GFM, Mermaid diagrams, KaTeX math,\ncode highlighting, and more.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
