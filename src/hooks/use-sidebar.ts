
"use client";

import * as React from "react";

const SIDEBAR_STATE_KEY = "sidebar-collapsed";

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const storedValue = localStorage.getItem(SIDEBAR_STATE_KEY);
    // Default to expanded (false) if no value is stored
    setIsCollapsed(storedValue ? JSON.parse(storedValue) : false);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prevState) => {
      if (prevState === undefined) return undefined;
      const newState = !prevState;
      // Persist the new state to localStorage.
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  return { isCollapsed, toggleSidebar };
}
