import { Image } from 'expo-image';

const logo = require('@/assets/images/logo-small.png');

/** Full NeoWell logo (mark + wordmark + tagline). Source image ratio ≈ 3.5:1. */
export function Logo({ width = 260 }: { width?: number }) {
  return (
    <Image
      source={logo}
      style={{ width, height: width / 3.52 }}
      contentFit="contain"
      accessibilityLabel="NeoWell — Track. Care. Thrive."
    />
  );
}
