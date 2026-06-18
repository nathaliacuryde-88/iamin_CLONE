import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the document to the top whenever the route changes. Without this,
 * navigating from a long page (feed, profile) into a detail page can land the
 * user partway down the new page.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);
  return null;
};

export default ScrollToTop;
