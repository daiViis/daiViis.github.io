// Mouse Drag Scrolling with Velocity Animation

document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('serviceCardsContainer');
    if (!container) return;

    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    let isDown = false;
    let startX;
    let scrollLeft;
    let lastX;
    let lastTime;
    let velocity = 0;
    let momentumId = null;

    // Mouse events (desktop only)
    if (!isMobile) {
        container.addEventListener('mousedown', handleStart);
        container.addEventListener('mousemove', handleMove);
        container.addEventListener('mouseup', handleEnd);
        container.addEventListener('mouseleave', handleEnd);
    }

    function handleStart(e) {
        isDown = true;
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.pageX;
        startX = clientX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        lastX = clientX;
        lastTime = Date.now();
        velocity = 0;
        
        // Cancel any existing momentum
        if (momentumId) {
            cancelAnimationFrame(momentumId);
            momentumId = null;
        }

        // Prevent text selection during drag (only for mouse events)
        if (!e.type.includes('touch')) {
            e.preventDefault();
        }
    }

    function handleMove(e) {
        if (!isDown) return;
        
        // Only prevent default for mouse events to allow native touch scrolling
        if (!e.type.includes('touch')) {
            e.preventDefault();
        }
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.pageX;
        const x = clientX - container.offsetLeft;
        const walk = (x - startX) * 1.5; // Scroll speed multiplier
        
        // Calculate velocity for momentum
        const currentTime = Date.now();
        const timeDelta = currentTime - lastTime;
        if (timeDelta > 0) {
            velocity = (clientX - lastX) / timeDelta;
        }
        
        container.scrollLeft = scrollLeft - walk;
        lastX = clientX;
        lastTime = currentTime;
    }

    function handleEnd(e) {
        if (!isDown) return;
        isDown = false;
        
        // Apply momentum scrolling
        if (Math.abs(velocity) > 0.1) {
            applyMomentum();
        }
    }

    function applyMomentum() {
        const friction = 0.95; // Momentum decay factor
        const minVelocity = 0.1;

        function momentumScroll() {
            if (Math.abs(velocity) < minVelocity) {
                momentumId = null;
                return;
            }

            container.scrollLeft -= velocity * 15; // Momentum scroll amount
            velocity *= friction;
            
            momentumId = requestAnimationFrame(momentumScroll);
        }

        momentumScroll();
    }

    // Prevent click events on cards during drag
    const cards = container.querySelectorAll('.group');
    cards.forEach(card => {
        let dragStartTime;
        
        card.addEventListener('mousedown', () => {
            dragStartTime = Date.now();
        });
        
        card.addEventListener('click', (e) => {
            const dragDuration = Date.now() - dragStartTime;
            if (dragDuration > 150) { // If dragged for more than 150ms, prevent click
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });
});