/* ─────────────────────────────────────────────────────────────
   Progresso — English (en-US)
   Bundled inline — NO external CDN / API calls (offline-first)
───────────────────────────────────────────────────────────── */
export const enUS = {
  /* ── Bottom Navigation ──────────────────────────────────── */
  nav: {
    train: 'TRAIN',
    stats: 'STATS',
    iron:  'IRON',
    log:   'LOG',
    set:   'SET',
  },

  /* ── Workout Home Page ──────────────────────────────────── */
  workout: {
    subtitle:       '// PROGRESSIVE OVERLOAD IRON TRACKER',
    startCta:       'INITIATE SESSION',
    weekSection:    'THIS WEEK',
    totalIronLabel: 'TOTAL IRON',
    sessionsLabel:  'SESSIONS',
    setsLabel:      'SETS',
    recentSection:  'RECENT IRON',
    emptyTitle:     'NO SESSIONS LOGGED',
    emptySub:       '> BEGIN YOUR FIRST SESSION_',
    kgUnit:         'KG',
    minUnit:        'MIN',
    hourUnit:       'H',
    emptySession:   'EMPTY SESSION',
  },

  /* ── Active Workout Page ────────────────────────────────── */
  active: {
    statusLabel:      'SESSION LIVE',
    abortBtn:         'ABORT',
    lockInBtn:        'LOCK IN',
    abortConfirm:     '// ABORT SESSION? PROGRESS LOST.',
    finalizeConfirm:  '// FINALIZE SESSION? DATA WILL BE FORGED INTO THE LOG.',
    ironMovedLabel:   'IRON MOVED',
    setsDoneLabel:    'SETS DONE',
    movementsLabel:   'MOVEMENTS',
    noMovementsTitle: 'NO MOVEMENTS LOADED',
    noMovementsSub:   '> ADD MOVEMENT BELOW_',
    addMovementBtn:   '+ LOAD MOVEMENT',
    doneColHeader:    'DONE',
    addSetBtn:        '+ ADD SET',
    pickerTitle:      'SELECT MOVEMENT',
    pickerSearch:     'SEARCH MOVEMENTS...',
  },

  /* ── History Page ───────────────────────────────────────── */
  history: {
    title:          'IRON LOG',
    recordedOne:    'SESSION RECORDED',
    recordedMany:   'SESSIONS RECORDED',
    forgeBtn:       '+ FORGE',
    noSessionsTitle:'NO SESSIONS LOGGED',
    noSessionsSub:  '> BEGIN YOUR FIRST SESSION_',
    kgLabel:        'KG',
    setsLabel:      'SETS',
    emptySession:   'EMPTY SESSION',
  },

  /* ── Manual Entry Page ──────────────────────────────────── */
  manualEntry: {
    entryLabel:      'MANUAL ENTRY',
    title:           'FORGE RECORD',
    backBtn:         'BACK',
    saveBtn:         'SAVE',
    volumeLabel:     'VOLUME',
    setsLabel:       'SETS',
    movesLabel:      'MOVES',
    dateLabel:       'DATE',
    durationLabel:   'DURATION (MIN)',
    noMovementsTitle:'NO MOVEMENTS ADDED',
    noMovementsSub:  '> LOAD A MOVEMENT BELOW_',
    addMovementBtn:  '+ LOAD MOVEMENT',
    colHash:         '#',
    colKg:           'KG',
    colReps:         'REPS',
    colDone:         '✓',
    addSetBtn:       '+ ADD SET',
    pickerTitle:     'SELECT MOVEMENT',
    pickerSearch:    'SEARCH...',
    errorDate:       '// DATE REQUIRED',
    errorMovement:   '// ADD AT LEAST ONE MOVEMENT',
  },

  /* ── Analytics Page ─────────────────────────────────────── */
  analytics: {
    title:            'IRON STATS',
    subtitle:         '// ALL-TIME PERFORMANCE DATA',
    sessionsLabel:    'SESSIONS',
    totalIronLabel:   'TOTAL IRON',
    totalSetsLabel:   'TOTAL SETS',
    avgSessionLabel:  'AVG SESSION',
    weeklySection:    'WEEKLY VOLUME',
    muscleSection:    'MUSCLE LOAD DISTRIBUTION',
    noDataLabel:      '> NO DATA_',
    setsUnit:         'SETS',
    tUnit:            'T',
    minUnit:          'M',
  },

  /* ── Exercise Library Page ──────────────────────────────── */
  exercises: {
    title:            'IRON LIBRARY',
    catalogueSuffix:  'MOVEMENTS CATALOGUED',
    searchPlaceholder:'SEARCH MOVEMENTS...',
    notFound:         'NO MOVEMENTS FOUND',
    allFilter:        'ALL',
  },

  /* ── Settings Page ──────────────────────────────────────── */
  settings: {
    title:          'SYSTEM',
    subtitle:       '// CONFIGURATION & DATA MANAGEMENT',
    appTagline:     'IRON DISCIPLINE TRACKER // v1.0',
    offlineNote:    'ALL DATA IS STORED LOCALLY IN YOUR BROWSER (INDEXEDDB). NO SERVER. NO CLOUD. OFFLINE-FIRST. YOUR IRON, YOUR DATA.',
    dataSection:    'DATA MANAGEMENT',
    localDbLabel:   'LOCAL DATABASE',
    localDbSub:     'INDEXEDDB ╱ BROWSER-LOCAL',
    activeLabel:    'ACTIVE',
    purgeLabel:     'PURGE ALL SESSION DATA',
    purgeSub:       'IRREVERSIBLE — CANNOT BE UNDONE',
    purgedLabel:    'DATA PURGED',
    purgedSub:      'LOG CLEARED SUCCESSFULLY',
    purgeConfirm:   '// PURGE ALL SESSION DATA? THIS CANNOT BE UNDONE.',
    protocolSection:'IRON PROTOCOL',
    tip1:           'LOG EVERY SET. TRACK PROGRESSIVE OVERLOAD.',
    tip2:           'MINIMUM 3 SESSIONS/WEEK FOR MEANINGFUL ANALYTICS.',
    tip3:           'ONLY COMPLETED SETS COUNT TOWARD VOLUME.',
    languageSection:'LANGUAGE',
  },
} as const

export type Locale = typeof enUS
