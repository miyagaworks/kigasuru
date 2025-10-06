import React from 'react';

/**
 * Icon component for displaying SVG icons from /assets/icons/
 * Supports multiple categories and sizes
 */
interface IconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  category: string;
  name: string;
  size?: number;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({
  category,
  name,
  size = 24,
  className = '',
  ...props
}) => {
  const iconPath = `/assets/icons/${category}/${category}-${name}.svg`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
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
