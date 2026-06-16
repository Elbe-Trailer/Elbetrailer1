"use client";

import Image, { type ImageProps } from "next/image";
import { publicStorageUrl } from "@/lib/storage";

type Props = Omit<ImageProps, "src"> & {
  bucket: string;
  path: string;
};

export default function StorageImage({ bucket, path, alt, ...rest }: Props) {
  const src = publicStorageUrl(bucket, path);
  if (!src) return null;

  return (
    <Image
      {...rest}
      src={src}
      alt={alt}
      loading={rest.priority ? undefined : rest.loading ?? "lazy"}
    />
  );
}
