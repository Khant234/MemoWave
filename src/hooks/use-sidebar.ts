"use client";

import * as React from "react";

const SIDEBAR_STATE_KEY = "sidebar-collapsed";

export function useSidebar() {
  // Default to `false` (expanded) for SSR and initial client render to avoid hydration mismatch.
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // On component mount, check localStorage for the user's preference.
  React.useEffect(() => {
    const storedValue = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (storedValue !== null) {
      setIsCollapsed(JSON.parse(storedValue));
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prevState) => {
      const newState = !prevState;
      // Persist the new state to localStorage.
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  return { isCollapsed, toggleSidebar };
}
