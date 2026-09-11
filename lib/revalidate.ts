import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

/** Bust settings data cache + public pages that read site config. */
export function revalidateSettings() {
  revalidateTag(CACHE_TAGS.settings);
  revalidatePath("/");
  revalidatePath("/picks");
  revalidatePath("/secondhand");
  revalidatePath("/checkout");
  revalidatePath("/admin/settings");
}

/** Bust catalog data cache + listing/detail shells. */
export function revalidateProducts(productId?: number) {
  revalidateTag(CACHE_TAGS.products);
  revalidatePath("/");
  revalidatePath("/picks");
  revalidatePath("/secondhand");
  revalidatePath("/admin/products");
  if (productId != null) {
    revalidatePath(`/deals/product/${productId}`);
    revalidatePath(`/secondhand/${productId}`);
  }
}
