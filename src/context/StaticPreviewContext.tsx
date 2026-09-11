import { createContext, useContext } from "react";

const StaticPreviewContext = createContext(false);

/** True inside the form-builder iframe preview. Nested players cannot run
 *  there (sandbox has no scripts); render posters instead. */
export function StaticPreviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaticPreviewContext.Provider value={true}>
      {children}
    </StaticPreviewContext.Provider>
  );
}

export function useStaticPreview() {
  return useContext(StaticPreviewContext);
}
