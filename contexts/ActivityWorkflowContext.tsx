import React, { createContext, useContext } from 'react';

type ActivityWorkflowChromeValue = {
  setActiveStepId: (stepId: string) => void;
};

const ActivityWorkflowChromeContext = createContext<ActivityWorkflowChromeValue>({
  setActiveStepId: () => {},
});

export function ActivityWorkflowChromeProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: ActivityWorkflowChromeValue;
}) {
  return (
    <ActivityWorkflowChromeContext.Provider value={value}>
      {children}
    </ActivityWorkflowChromeContext.Provider>
  );
}

export function useActivityWorkflowChrome() {
  return useContext(ActivityWorkflowChromeContext);
}
