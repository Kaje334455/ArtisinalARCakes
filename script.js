/* ============================================
   SMOOTH SCROLLING FOR NAVIGATION LINKS
   ============================================ */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

/* ============================================
   SCROLL-DRIVEN IMAGE SEQUENCE
   Controls the 5-stage cake decoration sequence
   that progresses as user scrolls
   ============================================ */
(function () {
  const sequenceSection = document.querySelector(".featured-cake-sequence");
  if (!sequenceSection) return;

  const frames = document.querySelectorAll(".sequence-frame");
  const totalFrames = frames.length;

  if (totalFrames === 0) return;

  // Preload all images for smooth transitions
  const images = document.querySelectorAll(".sequence-image");
  images.forEach((img) => {
    const imageSrc = img.getAttribute("src");
    const preloadImg = new Image();
    preloadImg.src = imageSrc;
  });

  let currentFrame = 0;
  let ticking = false;

  function updateSequence() {
    const rect = sequenceSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionTop = rect.top;
    const sectionHeight = rect.height;

    // Calculate scroll progress (0 to 1)
    // Progress starts when section top enters viewport (sectionTop = windowHeight)
    // Progress completes when section has scrolled past (sectionTop = -scrollRange)
    let progress = 0;

    // Calculate the scroll range (total scrollable distance while sticky)
    // This is the section height minus one viewport height (since sticky takes 1 viewport)
    const scrollRange = sectionHeight - windowHeight;

    // Check if section is in the scrollable range
    if (sectionTop <= windowHeight && sectionTop >= -scrollRange) {
      // Section is in the scroll range
      // Total scroll distance = windowHeight (to reach sticky) + scrollRange (while sticky) = sectionHeight
      // When sectionTop = windowHeight, progress = 0 (first image)
      // When sectionTop = -scrollRange, progress = 1 (last image)
      const scrolled = windowHeight - sectionTop;
      progress = Math.max(0, Math.min(1, scrolled / sectionHeight));
    } else if (sectionTop > windowHeight) {
      // Section hasn't entered viewport yet - show first frame
      progress = 0;
    } else {
      // Section has completed scroll range - show last frame
      progress = 1;
    }

    // Map progress (0-1) to frame index (0 to totalFrames-1)
    // Distribute frames evenly across the progress range
    const targetFrame = Math.floor(progress * totalFrames);
    const clampedFrame = Math.max(0, Math.min(totalFrames - 1, targetFrame));

    // Update active frame if it changed
    if (clampedFrame !== currentFrame) {
      frames.forEach((frame) => frame.classList.remove("active"));
      if (frames[clampedFrame]) {
        frames[clampedFrame].classList.add("active");
      }
      currentFrame = clampedFrame;
    }

    ticking = false;
  }

  // Throttled scroll handler using requestAnimationFrame
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateSequence);
      ticking = true;
    }
  }

  // Listen to scroll events
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  // Initial update
  updateSequence();

  // Also update on load to ensure correct initial state
  window.addEventListener("load", updateSequence);
})();

/* ============================================
   SCROLL-CONTROLLED 3D MODEL ROTATION
   Rotates model-viewer elements based on scroll position
   ============================================ */
(function () {
  const modelViewers = document.querySelectorAll(
    'model-viewer[data-scroll-rotate="true"]'
  );

  if (modelViewers.length === 0) return;

  let ticking = false;
  const modelData = new Map();

  // Initialize each model-viewer
  modelViewers.forEach((viewer) => {
    viewer.addEventListener("load", () => {
      // Store initial camera orbit
      const camera = viewer.cameraOrbit;
      modelData.set(viewer, {
        initialAzimuth: camera.azimuth || 0,
        rotationRange: Math.PI * 2, // Full 360-degree rotation
      });
    });
  });

  function updateModelRotations() {
    const windowHeight = window.innerHeight;

    modelViewers.forEach((viewer) => {
      if (!viewer.loaded) return;

      const rect = viewer.getBoundingClientRect();

      // Calculate if viewer is in viewport
      const isInViewport = rect.top < windowHeight && rect.bottom > 0;

      if (!isInViewport) return;

      const data = modelData.get(viewer);
      if (!data) return;

      // Calculate scroll progress for this viewer
      // Simple approach: progress based on viewer's position in viewport
      const viewerTop = rect.top;
      const viewerBottom = rect.bottom;
      const viewerHeight = rect.height;

      // Calculate progress: 0 when viewer enters viewport, 1 when it exits
      // This creates a full rotation as the viewer scrolls through
      let progress = 0;

      if (viewerTop <= windowHeight && viewerBottom >= 0) {
        // Viewer is in viewport
        // Progress from 0 (viewer top at viewport top) to 1 (viewer bottom at viewport bottom)
        const scrollRange = windowHeight + viewerHeight;
        const scrolled = windowHeight - viewerTop;
        progress = Math.max(0, Math.min(1, scrolled / scrollRange));
      } else if (viewerTop > windowHeight) {
        // Viewer hasn't entered viewport yet
        progress = 0;
      } else {
        // Viewer has scrolled past
        progress = 1;
      }

      // Map progress (0 to 1) to rotation (0 to 2π)
      // Full 360-degree rotation as viewer scrolls through viewport
      const azimuth = data.initialAzimuth + progress * data.rotationRange;

      // Update camera orbit (preserve existing polar and radius)
      try {
        const currentOrbit = viewer.cameraOrbit;
        const parts = currentOrbit.split(" ");
        if (parts.length >= 3) {
          viewer.cameraOrbit = `${azimuth}rad ${parts[1]} ${parts[2]}`;
        } else {
          viewer.cameraOrbit = `${azimuth}rad 1.5m 105%`;
        }
      } catch (e) {
        // Fallback if cameraOrbit assignment doesn't work
        viewer.setAttribute("camera-orbit", `${azimuth}rad 1.5m 105%`);
      }
    });

    ticking = false;
  }

  // Throttled scroll handler
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateModelRotations);
      ticking = true;
    }
  }

  // Listen to scroll events
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  // Initial update after a short delay to ensure models are loaded
  setTimeout(() => {
    updateModelRotations();
  }, 1000);
})();
