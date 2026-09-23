import { useState } from "react";

export function useCoinTooltip() {
  const [tooltip, setTooltip] = useState(null); // { coin, x, y }

  function bind(coin) {
    return {
      onMouseMove: (e) => setTooltip({ coin, x: e.clientX, y: e.clientY }),
      onMouseEnter: (e) => setTooltip({ coin, x: e.clientX, y: e.clientY }),
      onMouseLeave: () => setTooltip(null),
    };
  }

  return { tooltip, bind };
}
