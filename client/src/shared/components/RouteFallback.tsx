// Shown while a lazily-loaded route chunk is being fetched.
export const RouteFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh] w-full">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
  </div>
);
