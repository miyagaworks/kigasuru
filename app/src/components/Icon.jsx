import React from 'react';

/**
 * Icon component for displaying SVG icons from /assets/icons/
 * Supports multiple categories and sizes
 */
export const Icon = ({
  category,
  name,
  size = 24,
  className = '',
  ...props
}) => {
  const iconPath = `/assets/icons/${category}/${category}-${name}.svg`;

  return (
    <img
      src={iconPath}
      alt={`${category}-${name}`}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      {...props}
    />
  );
};
