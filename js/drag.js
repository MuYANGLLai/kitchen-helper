/* 轻量指针拖拽排序（支持触屏、跨容器；document 监听器单例，避免重复绑定） */
(function () {
  let active = null;
  let docBound = false;

  function point(e) {
    const t = e.touches && e.touches.length ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  }

  function distanceToRect(p, r) {
    const dx = Math.max(r.left - p.x, 0, p.x - r.right);
    const dy = Math.max(r.top - p.y, 0, p.y - r.bottom);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function nearest(els, p) {
    let best = null, bd = Infinity;
    for (const el of els) {
      const d = distanceToRect(p, el.getBoundingClientRect());
      if (d < bd) { bd = d; best = el; }
    }
    return best;
  }

  function onMove(e) {
    if (!active) return;
    const p = point(e);
    const dx = p.x - active.startX, dy = p.y - active.startY;
    if (!active.dragging) {
      if (Math.abs(dx) < 7 && Math.abs(dy) < 7) return;
      active.dragging = true;
      active.item.classList.add('dragging');
      document.body.classList.add('is-dragging');
    }
    active.moved = true;

    const containers = Array.from(document.querySelectorAll(active.contSel));
    if (!containers.length) return;
    const target = nearest(containers, p) || active.item.parentElement;

    let ref = null;
    const items = Array.from(target.querySelectorAll(':scope > ' + active.itemSel));
    for (const it of items) {
      if (it === active.item) continue;
      const r = it.getBoundingClientRect();
      if (p.y < r.top + r.height / 2) { ref = it; break; }
    }
    if (ref) target.insertBefore(active.item, ref);
    else target.appendChild(active.item);
  }

  function end() {
    if (!active) return;
    if (active.dragging) {
      active.item.classList.remove('dragging');
      document.body.classList.remove('is-dragging');
      if (active.moved) active.onDrop(active.item);
    }
    active = null;
  }

  function ensureDoc() {
    if (docBound) return;
    docBound = true;
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', end);
  }

  /**
   * opts: {
   *   root, itemSelector, handleSelector, containerSelector, onDrop(movedItemEl)
   * }
   */
  K.makeDraggable = function (opts) {
    ensureDoc();
    opts.root.addEventListener('pointerdown', function (e) {
      const handle = e.target.closest(opts.handleSelector);
      if (!handle) return;
      const item = handle.closest(opts.itemSelector);
      if (!item || !opts.root.contains(item)) return;
      const p = point(e);
      active = {
        item: item,
        startX: p.x, startY: p.y,
        dragging: false, moved: false,
        itemSel: opts.itemSelector,
        contSel: opts.containerSelector,
        onDrop: opts.onDrop
      };
    });
  };
})();
