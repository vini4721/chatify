function UsersLoadingSkeleton() {
  return (
    <div className="users-skeleton">
      {[1, 2, 3].map((item) => (
        <div key={item} className="skeleton-card" />
      ))}
    </div>
  );
}

export default UsersLoadingSkeleton;
