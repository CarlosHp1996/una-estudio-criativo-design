import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component that resets the window scroll position to (0, 0)
 * whenever the route changes.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // We use a small delay or requestAnimationFrame to ensure the scroll 
    // occurs after the new content has started rendering
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
