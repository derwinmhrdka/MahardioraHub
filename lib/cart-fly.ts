/** Fly a thumbnail from an element into the cart trigger. */
export function flyToCart(
  fromEl: HTMLElement | null,
  imageUrl?: string | null
) {
  if (typeof document === "undefined" || !fromEl) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    pulseCart();
    return;
  }

  const cart = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!cart) return;

  const from = fromEl.getBoundingClientRect();
  const to = cart.getBoundingClientRect();
  const size = 44;
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top + from.height / 2 - size / 2;
  const endX = to.left + to.width / 2 - size / 2;
  const endY = to.top + to.height / 2 - size / 2;
  const midX = startX + (endX - startX) * 0.45;
  const midY = Math.min(startY, endY) - 72;

  const flyer = document.createElement("div");
  flyer.setAttribute("aria-hidden", "true");
  flyer.className = "cart-flyer";
  Object.assign(flyer.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "12px",
    border: "2px solid #111",
    background: "#fff",
    boxShadow: "3px 3px 0 #111",
    overflow: "hidden",
    zIndex: "300",
    pointerEvents: "none",
    display: "grid",
    placeItems: "center",
    transform: `translate(${startX}px, ${startY}px) scale(1)`,
    opacity: "1",
  } as CSSStyleDeclaration);

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "";
    Object.assign(img.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    });
    flyer.appendChild(img);
  } else {
    flyer.textContent = "+";
    flyer.style.fontWeight = "800";
    flyer.style.fontSize = "1.1rem";
    flyer.style.fontFamily = "var(--font-body-stack), Nunito, sans-serif";
  }

  document.body.appendChild(flyer);

  const anim = flyer.animate(
    [
      {
        transform: `translate(${startX}px, ${startY}px) scale(1) rotate(-6deg)`,
        opacity: 1,
        offset: 0,
      },
      {
        transform: `translate(${midX}px, ${midY}px) scale(0.9) rotate(8deg)`,
        opacity: 1,
        offset: 0.55,
      },
      {
        transform: `translate(${endX}px, ${endY}px) scale(0.25) rotate(0deg)`,
        opacity: 0.35,
        offset: 1,
      },
    ],
    {
      duration: 680,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "forwards",
    }
  );

  void anim.finished
    .then(() => {
      flyer.remove();
      pulseCart();
    })
    .catch(() => {
      flyer.remove();
      pulseCart();
    });
}

function pulseCart() {
  const cart = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!cart) return;
  cart.classList.remove("cart-target-pulse");
  // reflow to restart animation
  void cart.offsetWidth;
  cart.classList.add("cart-target-pulse");
  window.setTimeout(() => {
    cart.classList.remove("cart-target-pulse");
  }, 520);
}
