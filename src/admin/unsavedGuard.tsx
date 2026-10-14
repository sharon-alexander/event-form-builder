import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

export type LeaveAction = () => void | Promise<void>;

type GuardHandler = (action: LeaveAction) => void;

const ConfirmLeaveContext = createContext<GuardHandler>((action) => {
  void action();
});

const RegisterGuardContext = createContext<(handler: GuardHandler | null) => void>(
  () => {},
);

export function UnsavedGuardProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<GuardHandler | null>(null);

  const confirmLeave = useCallback((action: LeaveAction) => {
    const handler = handlerRef.current;
    if (handler) handler(action);
    else void action();
  }, []);

  const register = useCallback((handler: GuardHandler | null) => {
    handlerRef.current = handler;
  }, []);

  return (
    <RegisterGuardContext.Provider value={register}>
      <ConfirmLeaveContext.Provider value={confirmLeave}>
        {children}
      </ConfirmLeaveContext.Provider>
    </RegisterGuardContext.Provider>
  );
}

/** Run an action now, or ask the editor first when it has unsaved changes. */
export function useConfirmLeave(): GuardHandler {
  return useContext(ConfirmLeaveContext);
}

/** Editor registers the handler that shows the unsaved-changes dialog. */
export function useRegisterLeaveGuard(): (handler: GuardHandler | null) => void {
  return useContext(RegisterGuardContext);
}
