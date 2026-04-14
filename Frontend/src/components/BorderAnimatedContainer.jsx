function BorderAnimatedContainer({ children, className = '' }) {
  return (
    <div className={`border-animated ${className}`.trim()}>
      <div className="border-animated-inner">{children}</div>
    </div>
  );
}

export default BorderAnimatedContainer;
