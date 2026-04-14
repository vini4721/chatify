function MessagesLoadingSkeleton() {
  return (
    <div className="messages-skeleton">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className={`skeleton-bubble ${item % 2 === 0 ? 'left' : 'right'}`}
        />
      ))}
    </div>
  );
}

export default MessagesLoadingSkeleton;
