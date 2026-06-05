const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('lotusAPI', {
  // Runtime info (renderer uses this to gate platform-specific UI)
  platform: process.platform,

  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // Serial port
  serial: {
    list: () => ipcRenderer.invoke('serial:list'),
    connect: (port, baudrate) => ipcRenderer.invoke('serial:connect', port, baudrate),
    disconnect: () => ipcRenderer.invoke('serial:disconnect'),
    send: (data) => ipcRenderer.invoke('serial:send', data),
    onData: (callback) => ipcRenderer.on('serial:data', (_, data) => callback(data)),
    onStatus: (callback) => ipcRenderer.on('serial:status', (_, status) => callback(status)),
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('serial:data')
      ipcRenderer.removeAllListeners('serial:status')
    },
  },

  // Arduino CLI
  arduino: {
    compile: (opts) => ipcRenderer.invoke('arduino:compile', opts),
    upload: (opts) => ipcRenderer.invoke('arduino:upload', opts),
    installPlatform: (platform) => ipcRenderer.invoke('arduino:installPlatform', platform),
    listPlatforms: () => ipcRenderer.invoke('arduino:listPlatforms'),
    coreList: () => ipcRenderer.invoke('arduino:coreList'),
    installCore: (pkg) => ipcRenderer.invoke('arduino:installCore', pkg),
    onProgress: (callback) => ipcRenderer.on('arduino:progress', (_, msg) => callback(msg)),
    removeProgressListener: () => ipcRenderer.removeAllListeners('arduino:progress'),
    onCoreStatus: (callback) => ipcRenderer.on('arduino:coreStatus', (_, payload) => callback(payload)),
    removeCoreStatusListener: () => ipcRenderer.removeAllListeners('arduino:coreStatus'),
  },

  // Board block definitions from KBIDE
  boards: {
    list: () => ipcRenderer.invoke('boards:list'),
    getBlockFiles: (boardId) => ipcRenderer.invoke('boards:getBlockFiles', boardId),
    getConfig: (boardId) => ipcRenderer.invoke('boards:getConfig', boardId),

    // User-installed board management
    userRoot:            ()             => ipcRenderer.invoke('boards:userRoot'),
    userList:            ()             => ipcRenderer.invoke('boards:userList'),
    pickPackage:         ()             => ipcRenderer.invoke('boards:pickPackage'),
    installFromFiles:    (payload)      => ipcRenderer.invoke('boards:installFromFiles', payload),
    uninstall:           (id)           => ipcRenderer.invoke('boards:uninstall', id),
    fetchCatalog:        (url)          => ipcRenderer.invoke('boards:fetchCatalog', url),
    downloadAndInstall:  (payload)      => ipcRenderer.invoke('boards:downloadAndInstall', payload),
  },

  // File system
  fs: {
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    readFileBase64: (filePath) => ipcRenderer.invoke('fs:readFileBase64', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    openDialog: (opts) => ipcRenderer.invoke('fs:openDialog', opts),
    saveDialog: (opts) => ipcRenderer.invoke('fs:saveDialog', opts),
  },

  // Shell (open URL in default browser)
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  },

  // USB-to-serial driver installation
  drivers: {
    install: (name) => ipcRenderer.invoke('drivers:install', name),
  },

  // Marketplace (catalogs + GitHub repo install — shared by plugins + boards)
  marketplace: {
    fetchCatalog:          (url)      => ipcRenderer.invoke('marketplace:fetchCatalog', url),
    resolveGithubRelease:  (repoSpec) => ipcRenderer.invoke('marketplace:resolveGithubRelease', repoSpec),
    downloadZip:           (url)      => ipcRenderer.invoke('marketplace:downloadZip', url),
    fetchUrl:              (url)      => ipcRenderer.invoke('marketplace:fetchUrl', url),
  },

  // Auto-update (electron-updater + GitHub Releases)
  updater: {
    state:    ()  => ipcRenderer.invoke('updater:state'),
    check:    ()  => ipcRenderer.invoke('updater:check'),
    download: ()  => ipcRenderer.invoke('updater:download'),
    install:  ()  => ipcRenderer.invoke('updater:install'),
    onState:  (cb) => ipcRenderer.on('updater:state', (_e, state) => cb(state)),
    removeStateListener: () => ipcRenderer.removeAllListeners('updater:state'),
  },

  // GitHub integration (OAuth Device Flow + Gist sync)
  github: {
    status:                ()         => ipcRenderer.invoke('github:status'),
    setClientId:           (id)       => ipcRenderer.invoke('github:setClientId', id),
    startDeviceFlow:       ()         => ipcRenderer.invoke('github:startDeviceFlow'),
    pollDeviceFlow:        ()         => ipcRenderer.invoke('github:pollDeviceFlow'),
    openVerificationUri:   (url)      => ipcRenderer.invoke('github:openVerificationUri', url),
    signOut:               ()         => ipcRenderer.invoke('github:signOut'),
    listGists:             ()         => ipcRenderer.invoke('github:listGists'),
    readGist:              (id)       => ipcRenderer.invoke('github:readGist', id),
    saveSketchAsGist:      (payload)  => ipcRenderer.invoke('github:saveSketchAsGist', payload),

    // Repo operations (Contents API)
    listRepos:             (opts)     => ipcRenderer.invoke('github:listRepos', opts || {}),
    listRepoContents:      (opts)     => ipcRenderer.invoke('github:listRepoContents', opts),
    readRepoFile:          (opts)     => ipcRenderer.invoke('github:readRepoFile', opts),
    saveSketchAsRepoFile:  (opts)     => ipcRenderer.invoke('github:saveSketchAsRepoFile', opts),
    listFileCommits:       (opts)     => ipcRenderer.invoke('github:listFileCommits', opts),
    createRepo:            (opts)     => ipcRenderer.invoke('github:createRepo', opts),
  },

  // Arduino libraries (managed via arduino-cli)
  libraries: {
    userRoot:        ()        => ipcRenderer.invoke('libraries:userRoot'),
    list:            ()        => ipcRenderer.invoke('libraries:list'),
    search:          (q)       => ipcRenderer.invoke('libraries:search', q),
    install:         (spec)    => ipcRenderer.invoke('libraries:install', spec),
    installFromGit:  (url)     => ipcRenderer.invoke('libraries:installFromGit', url),
    installFromZip:  (zipPath) => ipcRenderer.invoke('libraries:installFromZip', zipPath),
    pickZip:         ()        => ipcRenderer.invoke('libraries:pickZip'),
    uninstall:       (name)    => ipcRenderer.invoke('libraries:uninstall', name),
    updateIndex:     ()        => ipcRenderer.invoke('libraries:updateIndex'),
  },

  // Plugins (third-party Blockly extensions)
  plugins: {
    root:               ()            => ipcRenderer.invoke('plugins:root'),
    list:               ()            => ipcRenderer.invoke('plugins:list'),
    get:                (id)          => ipcRenderer.invoke('plugins:get', id),
    uninstall:          (id)          => ipcRenderer.invoke('plugins:uninstall', id),
    installFromFiles:   (payload)     => ipcRenderer.invoke('plugins:installFromFiles', payload),
    pickPackage:        ()            => ipcRenderer.invoke('plugins:pickPackage'),
  },
})
