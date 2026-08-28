/* 线条风格 SVG 图标集（24 viewBox，stroke currentColor） */
(function () {
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
    recipe: '<path d="M4 5a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    chevLeft: '<path d="M14 6l-6 6 6 6"/>',
    chevRight: '<path d="M10 6l6 6-6 6"/>',
    chevDown: '<path d="M6 9l6 6 6-6"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 13V9M9 2h6M12 2v3"/>',
    grip: '<path d="M5 6h14M5 12h14M5 18h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    meat: '<path d="M15.3 3a5.7 5.7 0 0 1 5.7 5.7c0 3.3-2.6 5.9-5.9 5.9H9.6L3.5 20.6l-1-1 6.1-6.1V10a4 4 0 0 1 4-4z"/>',
    veg: '<path d="M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16z"/><path d="M4 20c4-6 8-9 12-11"/>',
    seasoning: '<rect x="8" y="9" width="8" height="12" rx="2.5"/><path d="M9.5 9V7a2.5 2.5 0 0 1 5 0v2"/><path d="M10 14h.01M14 14h.01M12 17h.01"/>',
    sauce: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0C6 9.5 12 3 12 3z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
    pot: '<path d="M4 12h16a1 1 0 0 1 1 1v.5a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V13a1 1 0 0 1 1-1z"/><path d="M2 12h20M9 9V5h6v4"/>',
    fire: '<path d="M12 2.5s6 5.5 6 11a6 6 0 0 1-12 0c0-2.5 1-4.5 1-4.5s1 2 2.5 3C9 8 12 2.5 12 2.5z"/>',
    note: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    reset: '<path d="M3 12a9 9 0 1 0 2.6-6.7M3 4v4h4"/>',
    history: '<path d="M3 12a9 9 0 1 0 2.6-6.7"/><path d="M3 4v4h4"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 15.5 16 10l-9 9"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    empty: '<path d="M4 7h16M7 7l1 13h8l1-13M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    bowl: '<path d="M4 11h16a1 1 0 0 1 1 1 9 9 0 0 1-18 0 1 1 0 0 1 1-1z"/><path d="M8 8c1.5 2 2 3 4 3s2.5-1 4-3"/>'
  };

  window.K = window.K || {};
  K.icon = function (name, size) {
    const body = ICONS[name] || '';
    const s = size || 22;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  };
  K.icons = ICONS;
})();
